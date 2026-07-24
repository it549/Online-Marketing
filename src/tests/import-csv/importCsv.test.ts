import fs from "node:fs";
import path from "node:path";

import { importCsv } from "@/server/core/import/import.service";
import { Platform } from "@/server/core/import/import.types";

const filePath = path.join(process.cwd(), "src", "tests", "import-csv", "fixtures", "shopee-report.csv");
const csvContent = fs.readFileSync(filePath, "utf-8");

const result = importCsv({
    platformCode: Platform.SHOPEE,
    fileName: "shopee-report.csv",
    csvContent,
});

console.log("========== IMPORT RESULT ==========");
console.log({
    platformCode: result.platformCode,
    report: result.report,
    campaignCount: result.campaigns.length,
});

console.log("========== FIRST CAMPAIGN ==========");
console.log(result.campaigns[0]);
