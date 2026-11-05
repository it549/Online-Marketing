import { NextRequest } from "next/server";
import { generateContentController } from "@/server/modules/ai-content/aiContent.controller";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    return generateContentController(request);
}