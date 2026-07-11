import { NextRequest, NextResponse } from "next/server";
import { Platform } from "@/types/platform";
import { getDashboardService } from "./dashboard.service";

export async function getDashboard(request: NextRequest) {
    try {
        const platform = (request.nextUrl.searchParams.get("platform") as Platform) || "facebook";
        const dashboard = await getDashboardService(platform);

        return NextResponse.json(dashboard);
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Dashboard Error",
            },
            {
                status: 500,
            },
        );
    }
}
