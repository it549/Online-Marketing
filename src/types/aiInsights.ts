export type AiInsightsSource = "api" | "imported" | "synced";

export interface AiInsightsResponse {
    generatedAt: string;
    sources: AiInsightsSource[];
    content: string;
}
