import { NextRequest, NextResponse } from "next/server";
import { getFacebookCampaignDetail } from "@/server/modules/facebook/content/facebookContentAnalytics.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

const FACEBOOK_ID_PREFIX = "facebook-";

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const { campaignId } = await params;

    if (!campaignId.startsWith(FACEBOOK_ID_PREFIX)) {
        return NextResponse.json({ error: "รายละเอียดแคมเปญยังไม่รองรับแพลตฟอร์มนี้" }, { status: 404 });
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        console.log("Company ID", companyId)
        const externalCampaignId = campaignId.slice(FACEBOOK_ID_PREFIX.length);
        const data = await getFacebookCampaignDetail(companyId, externalCampaignId);

        if (!data) {
            return NextResponse.json({ error: "ไม่พบแคมเปญนี้" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Campaign Detail Error" },
            { status: 500 },
        );
    }
}
