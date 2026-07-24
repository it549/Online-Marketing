import { ContentPlatformCode, NormalizedContentImportResult } from "./content-import.types";
import { validateContentImportResult } from "./content-import.validator";
import { parseFacebookContentCsv } from "@/server/modules/facebook-content/facebookContent.csv.parser";
import { normalizeFacebookContentRows } from "@/server/modules/facebook-content/facebookContent.adapter";

interface ImportContentCsvInput {
    platformCode: ContentPlatformCode;
    fileName: string;
    csvContent: string;
}

export function importContentCsv(input: ImportContentCsvInput): NormalizedContentImportResult {
    if (input.platformCode === "FACEBOOK") {
        return importFacebookContentCsv(input);
    }

    throw new Error(`Unsupported content platform: ${input.platformCode}`);
}

function importFacebookContentCsv(input: ImportContentCsvInput): NormalizedContentImportResult {
    const parsedReport = parseFacebookContentCsv(input.csvContent, input.fileName);
    const posts = normalizeFacebookContentRows(parsedReport.rows);

    const result: NormalizedContentImportResult = {
        platformCode: "FACEBOOK",
        fileName: input.fileName,
        rangeStartDate: parsedReport.rangeStartDate,
        rangeEndDate: parsedReport.rangeEndDate,
        posts,
    };

    validateContentImportResult(result);
    return result;
}
