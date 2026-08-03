import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { updateGoogleAdsConnection } from "@/server/modules/company/company.repository";
import { config } from "@/server/configurations/config";

const STATE_COOKIE_NAME = "google_ads_oauth_state";
const GOOGLE_ADS_API_VERSION = "v24"; // เช็ค version ล่าสุดที่ google-ads-api library ใช้อยู่

function redirectWithBanner(request: NextRequest, status: "connected" | "error", message?: string) {
    const url = new URL("/", request.url);
    url.searchParams.set("view", "integrations");
    url.searchParams.set("googleAds", status);
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url);
}

/** ดึงรายชื่อ customer ID ทั้งหมดที่ access token นี้เข้าถึงได้ */
async function fetchAccessibleCustomerIds(accessToken: string): Promise<string[]> {
    const response = await fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": config.google.develoerToken,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        // Google's error is nested a few levels deep (error.details[].errors[].message) --
        // console.error on the raw object truncates it to "[Array]" past Node's default
        // inspect depth, hiding the actually-useful reason (e.g. "NOT_ADS_USER"). Log the
        // full JSON instead so the real cause is visible in the server log.
        console.error("listAccessibleCustomers failed:", JSON.stringify(data, null, 2));
        const detailedMessage = data?.error?.details?.flatMap((d: { errors?: { message?: string }[] }) => d.errors ?? [])?.[0]?.message;
        throw new Error(detailedMessage ?? "ไม่สามารถดึงรายชื่อบัญชี Google Ads ได้");
    }

    const resourceNames: string[] = data.resourceNames ?? [];
    return resourceNames.map((name) => name.replace("customers/", ""));
}

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const savedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
        return redirectWithBanner(request, "error", "ผู้ใช้ปฏิเสธการเชื่อมต่อ หรือเกิดข้อผิดพลาดจาก Google");
    }

    if (!code || !state || !savedState || state !== savedState) {
        return redirectWithBanner(request, "error", "การเชื่อมต่อไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
    }

    try {
        const companyId = await getSelectedCompanyId(request);

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: config.google.clientID,
                client_secret: config.google.clientSecret,
                redirect_uri: config.google.redirectUrl,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.refresh_token) {
            console.error("Google OAuth token exchange failed:", tokenData);
            return redirectWithBanner(
                request,
                "error",
                "ไม่ได้รับ refresh token จาก Google (อาจเคยเชื่อมต่อไปแล้ว ลองไปที่ Google Account permissions แล้วเอาสิทธิ์ออกก่อน แล้วเชื่อมต่อใหม่)"
            );
        }

        const customerIds = await fetchAccessibleCustomerIds(tokenData.access_token);

        if (customerIds.length === 0) {
            return redirectWithBanner(
                request,
                "error",
                "ไม่พบบัญชี Google Ads ที่เข้าถึงได้ ตรวจสอบว่าบัญชีนี้มีสิทธิ์เข้าถึง Google Ads account หรือยัง"
            );
        }

        const selectedCustomerId = customerIds[0];
        await updateGoogleAdsConnection(companyId, {
            customerId: selectedCustomerId,
            refreshToken: tokenData.refresh_token,
        });

        const response =
            customerIds.length > 1
                ? redirectWithBanner(
                    request,
                    "connected",
                    `เชื่อมต่อสำเร็จ (ใช้บัญชี ${selectedCustomerId}) — พบทั้งหมด ${customerIds.length} บัญชี ถ้าต้องการใช้บัญชีอื่น ไปตั้งค่าเพิ่มเติมได้`
                )
                : redirectWithBanner(request, "connected", "เชื่อมต่อ Google Ads สำเร็จแล้ว");

        response.cookies.delete(STATE_COOKIE_NAME);
        return response;
    } catch (err) {
        console.error("Google Ads OAuth callback error:", err);
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างเชื่อมต่อ Google Ads";
        return redirectWithBanner(request, "error", message);
    }
}