import { NormalizedImportResult, Platform, } from "./import.types";
import { parseShopeeCsv, } from "@/server/modules/shopee/shopee-csv.parser";
import { normalizeShopeeCampaigns, } from "@/server/modules/shopee/shopee.adapter";
import { validateImportResult, } from "./import.validator";

interface ImportCsvInput {
    platformCode: Platform.SHOPEE;
    fileName: string;
    csvContent: string;
}

export function importCsv(input: ImportCsvInput,): NormalizedImportResult {
    if (input.platformCode === Platform.SHOPEE) {
        return importShopeeCsv(input);
    }

    throw new Error(`Unsupported platform: ${input.platformCode}`,);
}

function importShopeeCsv(input: ImportCsvInput,): NormalizedImportResult {
    const parsedReport = parseShopeeCsv(input.csvContent,);
    const normalizedCampaigns = normalizeShopeeCampaigns(parsedReport.campaigns,);

    if (!parsedReport.metadata.reportStartDate || !parsedReport.metadata.reportEndDate) {
        throw new Error("ไม่พบช่วงเวลาของ Report",);
    }

    const result: NormalizedImportResult = {
        platformCode: "SHOPEE",
        report: {
            fileName: input.fileName,
            reportName: "Shopee CPC Advertising Report",
            reportStartDate: parsedReport.metadata.reportStartDate,
            reportEndDate: parsedReport.metadata.reportEndDate,
            totalRecords: normalizedCampaigns.length,
        },
        campaigns: normalizedCampaigns,
    }

    validateImportResult(result);
    return result
}