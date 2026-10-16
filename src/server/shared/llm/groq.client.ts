import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// All run on free tiers: Gemini writes the most natural Thai, tried in order
// (newest models often return 503 under load), Groq is the last resort.
const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash"];
const GROQ_FALLBACK_MODEL = "openai/gpt-oss-120b";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const gemini = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

export async function generateLlmText(prompt: string, maxTokens = 2048): Promise<string> {
    for (const modelName of gemini ? GEMINI_MODELS : []) {
        try {
            const model = gemini!.getGenerativeModel({ model: modelName, generationConfig: { maxOutputTokens: maxTokens } });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) return text;
        } catch (error) {
            console.warn(`Gemini ${modelName} failed, trying next model:`, error instanceof Error ? error.message : error);
        }
    }

    const completion = await groq.chat.completions.create({
        model: GROQ_FALLBACK_MODEL,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        // gpt-oss counts reasoning tokens against this budget -- keep reasoning short
        // so long Thai answers aren't cut off.
        max_tokens: maxTokens,
        reasoning_effort: "low",
    });

    return completion.choices[0]?.message?.content ?? "";
}
