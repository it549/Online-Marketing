import { generatePlanRepository } from "./aiPlanner.repository";
import { generateMarketingPlanPrompt } from "./prompt";

interface GeneratePlanDto {
    budget: number;
    goal: string;
    area?: string;
}

export async function generatePlanService(
    data: GeneratePlanDto,
) {
    const prompt = generateMarketingPlanPrompt(
        data.budget,
        data.goal,
        data.area,
    );

    const plan = await generatePlanRepository(prompt);

    return {
        plan,
    };
}