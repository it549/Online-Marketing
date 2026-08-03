import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { updateFacebookConnection } from "@/server/modules/company/company.repository";
import { config } from "@/server/configurations/config";

const STATE_COOKIE_NAME = "facebook_oauth_state";

function redirectWithBanner(request: NextRequest, status: "connected" | "error", message?: string) {
    const url = new URL("/", request.url);
    url.searchParams.set("view", "integrations");
    url.searchParams.set("facebook", status);
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const savedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
        return redirectWithBanner(request, "error", "ผู้ใช้ปฏิเสธการเชื่อมต่อ หรือเกิดข้อผิดพลาดจาก Facebook");
    }

    if (!code || !state || !savedState || state !== savedState) {
        return redirectWithBanner(request, "error", "การเชื่อมต่อไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        const baseUrl = `${config.facebook.baseUrl}/${config.facebook.apiVersion}`;

        // 1. แลก code เป็น short-lived access token
        const shortLivedUrl = new URL(`${baseUrl}/oauth/access_token`);
        shortLivedUrl.searchParams.set("client_id", config.facebook.appId);
        shortLivedUrl.searchParams.set("client_secret", config.facebook.appSecret);
        shortLivedUrl.searchParams.set("redirect_uri", config.facebook.redirectUrl);
        shortLivedUrl.searchParams.set("code", code);

        const shortLivedResponse = await fetch(shortLivedUrl.toString());
        const shortLivedData = await shortLivedResponse.json();

        if (!shortLivedResponse.ok || !shortLivedData.access_token) {
            console.error("Facebook short-lived token exchange failed:", shortLivedData);
            return redirectWithBanner(request, "error", "ไม่สามารถแลก access token จาก Facebook ได้");
        }

        // 2. แลก short-lived เป็น long-lived token (อายุ ~60 วัน)
        const longLivedUrl = new URL(`${baseUrl}/oauth/access_token`);
        longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
        longLivedUrl.searchParams.set("client_id", config.facebook.appId);
        longLivedUrl.searchParams.set("client_secret", config.facebook.appSecret);
        longLivedUrl.searchParams.set("fb_exchange_token", shortLivedData.access_token);

        const longLivedResponse = await fetch(longLivedUrl.toString());
        const longLivedData = await longLivedResponse.json();

        if (!longLivedResponse.ok || !longLivedData.access_token) {
            console.error("Facebook long-lived token exchange failed:", longLivedData);
            return redirectWithBanner(request, "error", "ไม่สามารถแลก long-lived token จาก Facebook ได้");
        }

        const accessToken: string = longLivedData.access_token;
        const expiresInSeconds: number = longLivedData.expires_in ?? 60 * 60 * 24 * 60; // fallback 60 วัน
        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

        // 3. ดึงรายชื่อ ad account ที่ user คนนี้เข้าถึงได้
        const adAccountsUrl = new URL(`${baseUrl}/me/adaccounts`);
        adAccountsUrl.searchParams.set("fields", "id,name,account_id");
        adAccountsUrl.searchParams.set("access_token", accessToken);

        const adAccountsResponse = await fetch(adAccountsUrl.toString());
        const adAccountsData = await adAccountsResponse.json();

        if (!adAccountsResponse.ok || !adAccountsData.data) {
            console.error("Fetching Facebook ad accounts failed:", adAccountsData);
            return redirectWithBanner(request, "error", "ไม่พบ Ad Account ที่เข้าถึงได้ในบัญชี Facebook นี้");
        }

        const adAccounts: Array<{ id: string; name: string; account_id: string }> = adAccountsData.data;

        if (adAccounts.length === 0) {
            return redirectWithBanner(
                request,
                "error",
                "ไม่พบ Ad Account ที่เข้าถึงได้ ตรวจสอบว่าบัญชีนี้มีสิทธิ์เข้าถึง Facebook Ads Manager หรือยัง"
            );
        }

        // 4. บันทึก (เลือกตัวแรกถ้ามีหลาย ad account)
        const selectedAccount = adAccounts[0];
        // id ที่ได้จาก /me/adaccounts มักมี prefix "act_" อยู่แล้ว เก็บตามที่ Graph API คืนมาเพื่อใช้เรียก insights ต่อได้ตรงๆ
        await updateFacebookConnection(companyId, {
            adAccountId: selectedAccount.id,
            accessToken,
            expiresAt,
        });

        const response =
            adAccounts.length > 1
                ? redirectWithBanner(
                    request,
                    "connected",
                    `เชื่อมต่อสำเร็จ (ใช้บัญชี ${selectedAccount.name}) — พบทั้งหมด ${adAccounts.length} บัญชี ถ้าต้องการใช้บัญชีอื่น ไปตั้งค่าเพิ่มเติมได้`
                )
                : redirectWithBanner(request, "connected", "เชื่อมต่อ Facebook สำเร็จแล้ว");

        response.cookies.delete(STATE_COOKIE_NAME);
        return response;
    } catch (err) {
        console.error("Facebook OAuth callback error:", err);
        return redirectWithBanner(request, "error", "เกิดข้อผิดพลาดระหว่างเชื่อมต่อ Facebook");
    }
}