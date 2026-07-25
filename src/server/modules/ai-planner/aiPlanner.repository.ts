import Groq from "groq-sdk";
import { config } from "@/server/configurations/config";

const groq = new Groq({
    apiKey: config.groq,
});

export async function generatePlanRepository(prompt: string) {
    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content ?? "";
}