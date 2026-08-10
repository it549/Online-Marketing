import { NextRequest, NextResponse } from "next/server";
import { getContentCalendar } from "@/server/modules/facebook/content/contentCalendar.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import type { ContentCalendarView } from "@/types/contentCalendar";

const VALID_VIEWS: ContentCalendarView[] = ["daily", "weekly", "monthly"];

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);

        const requestedView = request.nextUrl.searchParams.get("view");
        const view: ContentCalendarView = VALID_VIEWS.includes(requestedView as ContentCalendarView)
            ? (requestedView as ContentCalendarView)
            : "weekly";

        const dateParam = request.nextUrl.searchParams.get("date");
        const referenceDate = dateParam && !Number.isNaN(new Date(dateParam).getTime()) ? new Date(dateParam) : new Date();

        const data = await getContentCalendar(companyId, view, referenceDate);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Content Calendar Error" },
            { status: 500 },
        );
    }
}
