import { NextRequest, NextResponse } from "next/server";
import { syncFacebookContentFromApi } from "@/server/modules/facebook/content/facebookContentSync.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const importJob = await syncFacebookContentFromApi(companyId);

        return NextResponse.json({
            success: true,
            data: {
                importJobId: importJob.id.toString(),
                status: importJob.status,
                totalRecords: importJob.totalRecords,
                importedAt: importJob.importedAt,
            },
        });
    } catch (error) {
        console.error("Facebook Content Sync Error:", error);

        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Sync failed" },
            { status: 500 },
        );
    }
}
