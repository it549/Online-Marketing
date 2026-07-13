import { NextRequest } from "next/server";
import { generatePlan } from "@/server/modules/ai-planner/aiPlanner.controller";

export async function POST(request: NextRequest) {
    return generatePlan(request);
}