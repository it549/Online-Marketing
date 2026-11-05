import { NextRequest, NextResponse } from "next/server";
import { generatePlanService } from "./aiPlanner.service";

export async function generatePlan(
    request: NextRequest,
) {
    try {
        const body = await request.json();

        const result = await generatePlanService(body);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "AI Error",
            },
            {
                status: 500,
            },
        );
    }
}