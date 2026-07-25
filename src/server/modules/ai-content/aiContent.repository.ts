import { generateLlmText } from "@/server/shared/llm/groq.client";

export async function generateContent(prompt: string) {
    return generateLlmText(prompt);
}