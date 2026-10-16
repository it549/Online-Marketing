import { generateLlmText } from "@/server/shared/llm/groq.client";

export async function generatePlanRepository(prompt: string) {
    return generateLlmText(prompt, 3072);
}
