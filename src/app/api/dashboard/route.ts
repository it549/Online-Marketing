import { NextRequest } from "next/server";
import { getDashboard } from "@/server/modules/dashboard/dashboard.controller";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    return getDashboard(request);
}
