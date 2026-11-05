import { generateLlmText } from "@/server/shared/llm/groq.client";
import { getShopeeDashboardData } from "@/server/modules/shopee/shopeeDashboard.service";
import { AiInsightsResponse, AiInsightsSource } from "@/types/aiInsights";
import { buildShopeeInsightsPrompt } from "./shopeeInsights.prompt";
import { getShopeeCampaignProfitRanking } from "./shopeeTopCampaigns";

export async function generateShopeeInsights(companyId: bigint): Promise<AiInsightsResponse> {
    const [dashboard, campaignRanking] = await Promise.all([
        getShopeeDashboardData(companyId, "month", {}),
        getShopeeCampaignProfitRanking(companyId),
    ]);

    const sources: AiInsightsSource[] = [];
    if (dashboard.hasData) sources.push("imported");

    if (sources.length === 0) {
        throw new Error("ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ (ยังไม่มีไฟล์นำเข้า)");
    }

    const prompt = buildShopeeInsightsPrompt(dashboard, campaignRanking);
    const content = await generateLlmText(prompt);

    return {
        generatedAt: new Date().toISOString(),
        sources,
        content,
    };
}
