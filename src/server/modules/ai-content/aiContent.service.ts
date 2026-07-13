import { AIContentRequest } from "@/server/types/AIContent";
import { buildContentPrompt } from "./aiContent.prompt";
import { generateContent } from "./aiContent.repository";

export async function generateContentService(
    body: AIContentRequest,
) {
    const prompt = buildContentPrompt(body);

    const content = await generateContent(prompt);

    return {
        content,
    };
}