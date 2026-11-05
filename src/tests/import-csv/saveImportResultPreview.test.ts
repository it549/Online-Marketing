import fs from "node:fs";
import path from "node:path";

import { importCsv } from "@/server/core/import/import.service";
import { Platform } from "@/server/core/import/import.types";

// Preview-only: shows the exact campaign/metric rows saveImportResult() would
// write, without ever calling it — this script never touches the database.
const filePath = path.join(process.cwd(), "src", "tests", "import-csv", "fixtures", "shopee-report.csv");
const csvContent = fs.readFileSync(filePath, "utf-8");

const result = importCsv({
    platformCode: Platform.SHOPEE,
    fileName: "shopee-report.csv",
    csvContent,
});

console.log("========== IMPORT JOB (preview, not persisted) ==========");
console.log({
    platformCode: result.platformCode,
    reportName: result.report.reportName,
    reportStartDate: result.report.reportStartDate,
    reportEndDate: result.report.reportEndDate,
    totalRecords: result.report.totalRecords,
});

console.log("========== CAMPAIGN ROWS (preview, not persisted) ==========");
for (const campaign of result.campaigns) {
    console.log({
        externalCampaignId: campaign.externalCampaignId,
        campaignName: campaign.campaignName,
        campaignStatus: campaign.campaignStatus,
        spend: campaign.metrics.spend,
        revenue: campaign.metrics.revenue,
        orders: campaign.metrics.orders,
    });
}

console.log(`\nNote: saveImportResult() was not called — ${result.campaigns.length} campaign(s) previewed above, 0 written to the database.`);
