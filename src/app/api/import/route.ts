import { NextResponse, } from "next/server";
import { importCsv, } from "@/server/core/import/import.service";
import { saveImportResult, } from "@/server/core/import/import-database.service";
import { Platform, } from "@/server/core/import/import.types";

export async function POST(request: Request,) {
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

        if (platformCode !== Platform.SHOPEE) {
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

        const result = importCsv({
            platformCode,
            fileName: file.name,
            csvContent,
        });

        const importJob = await saveImportResult(result, file.name,);

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
        console.error("CSV Import Error:", error,);

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