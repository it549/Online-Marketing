import { generateLlmText } from "@/server/shared/llm/groq.client";
import { getFacebookApiPerformance } from "@/server/modules/facebook/facebookApiPerformance.service";
import { getFacebookContentAnalytics } from "@/server/modules/facebook-content/facebookContentAnalytics.service";
import { AiInsightsResponse, AiInsightsSource } from "@/types/aiInsights";
import { buildFacebookInsightsPrompt } from "./facebookInsights.prompt";

export async function generateFacebookInsights(): Promise<AiInsightsResponse> {
    const [apiPerformance, contentAnalytics] = await Promise.all([
        getFacebookApiPerformance(),
        getFacebookContentAnalytics(),
    ]);

    const sources: AiInsightsSource[] = [];
    if (apiPerformance.connected) sources.push("api");
    if (contentAnalytics.hasData) sources.push("imported");

    if (sources.length === 0) {
        throw new Error("ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ (ยังไม่ได้เชื่อมต่อ API และยังไม่มีไฟล์นำเข้า)");
    }

    const prompt = buildFacebookInsightsPrompt(apiPerformance, contentAnalytics);
    const content = await generateLlmText(prompt);

    return {
        generatedAt: new Date().toISOString(),
        sources,
        content,
    };
}
