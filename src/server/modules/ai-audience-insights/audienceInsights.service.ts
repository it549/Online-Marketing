import { generateLlmText } from "@/server/shared/llm/groq.client";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { getAudienceBreakdown, getLeadsSummaryOnly, getSpendTrend } from "@/server/modules/insights/insights.service";
import type { AiInsightsResponse, AiInsightsSource } from "@/types/aiInsights";
import type { CompanyPlatformId } from "@/types/company";
import type { BreakdownDimension } from "@/types/insights";
import { buildAudienceInsightsPrompt } from "./audienceInsights.prompt";

const ALL_DIMENSIONS: BreakdownDimension[] = ["AGE", "GENDER", "REGION", "PUBLISHER_PLATFORM", "PLATFORM_POSITION"];

const PLATFORM_LABEL: Record<CompanyPlatformId, string> = {
    facebook: "Facebook",
    shopee: "Shopee",
    tiktok: "TikTok",
    googleAds: "Google Ads",
};

export async function generateAudienceInsights(
    companyId: bigint,
    platform: CompanyPlatformId,
    dateFrom: Date,
    dateTo: Date,
): Promise<AiInsightsResponse> {
    const company = await getCompanyById(companyId);
    if (!company) throw new Error("ไม่พบข้อมูลบริษัท");

    const [breakdowns, trend, leadsSummaryOnly] = await Promise.all([
        Promise.all(ALL_DIMENSIONS.map((dimension) => getAudienceBreakdown(companyId, platform, dimension, dateFrom, dateTo))),
        getSpendTrend(companyId, platform, dateFrom, dateTo),
        // PII-safe: getLeadsSummaryOnly never touches fullName/email/phone/raw.
        getLeadsSummaryOnly(companyId, platform, dateFrom, dateTo),
    ]);

    const hasAnyData = trend.hasDataInRange || breakdowns.some((b) => b.hasDataInRange) || leadsSummaryOnly.hasDataInRange;

    if (!hasAnyData) {
        throw new Error("ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ในช่วงเวลาที่เลือก");
    }

    const sources: AiInsightsSource[] = ["synced"];

    const prompt = buildAudienceInsightsPrompt({
        companyName: company.name,
        platformLabel: PLATFORM_LABEL[platform],
        dateFromLabel: dateFrom.toLocaleDateString("th-TH"),
        dateToLabel: dateTo.toLocaleDateString("th-TH"),
        breakdowns,
        trend,
        leadsSummary: leadsSummaryOnly.summary,
    });

    const content = await generateLlmText(prompt);

    return { generatedAt: new Date().toISOString(), sources, content };
}
