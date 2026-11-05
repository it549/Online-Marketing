import { NextRequest, NextResponse } from "next/server";
import { importContentCsv } from "@/server/core/content-import/content-import.service";
import { saveContentImportResult } from "@/server/core/content-import/content-import-database.service";
import { ContentPlatformCode } from "@/server/core/content-import/content-import.types";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

const SUPPORTED_PLATFORM_CODES: ContentPlatformCode[] = ["FACEBOOK"];

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const platformCode = formData.get("platformCode");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                {
                    error: "CSV file is required",
                },

                {
                    status: 400,
                },
            );
        }

        if (!SUPPORTED_PLATFORM_CODES.includes(platformCode as ContentPlatformCode)) {
            return NextResponse.json(
                {
                    error: "Unsupported or missing platform code",
                },

                {
                    status: 400,
                },
            );
        }

        const csvContent = await file.text();

        const result = importContentCsv({
            platformCode: platformCode as ContentPlatformCode,
            fileName: file.name,
            csvContent,
        });

        const companyId = await getSelectedCompanyId(request);
        const importJob = await saveContentImportResult(result, file.name, companyId);

        return NextResponse.json(
            {
                success: true,
                data: {
                    importJobId: importJob.id.toString(),
                    status: importJob.status,
                    filename: importJob.filename,
                    totalRecords: importJob.totalRecords,
                    importedAt: importJob.importedAt,
                },
            },

            {
                status: 201,
            },
        );
    } catch (error) {
        console.error("Content CSV Import Error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Import failed",
            },

            {
                status: 500,
            },
        );
    }
}
