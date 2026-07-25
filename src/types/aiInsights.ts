export type AiInsightsSource = "api" | "imported";

export interface AiInsightsResponse {
    generatedAt: string;
    sources: AiInsightsSource[];
    content: string;
}
