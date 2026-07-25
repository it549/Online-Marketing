import { NextRequest } from "next/server";
import { generatePlan } from "@/server/modules/ai-planner/aiPlanner.controller";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    return generatePlan(request);
}