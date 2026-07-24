import { NextRequest, NextResponse } from "next/server";
import { getShopeeDashboardData } from "@/server/modules/shopee/shopeeDashboard.service";
import { ShopeePeriodGranularity } from "@/types/shopeeDashboard";

const VALID_GRANULARITIES: ShopeePeriodGranularity[] = ["week", "month", "quarter"];

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams;
        const periodParam = params.get("period");
        const granularity: ShopeePeriodGranularity = VALID_GRANULARITIES.includes(periodParam as ShopeePeriodGranularity)
            ? (periodParam as ShopeePeriodGranularity)
            : "week";

        const dashboard = await getShopeeDashboardData(granularity, {
            dateFrom: params.get("dateFrom") ?? undefined,
            dateTo: params.get("dateTo") ?? undefined,
            productId: params.get("productId") ?? undefined,
            campaignName: params.get("campaignName") ?? undefined,
            status: params.get("status") ?? undefined,
        });

        return NextResponse.json(dashboard);
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Shopee Dashboard Error",
            },

            {
                status: 500,
            },
        );
    }
}
