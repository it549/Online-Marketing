import fs from "node:fs";
import path from "node:path";

import { parseShopeeCsv } from "@/server/modules/shopee/shopee-csv.parser";
import { normalizeShopeeCampaigns } from "@/server/modules/shopee/shopee.adapter";

const filePath = path.join(process.cwd(), "src", "tests", "import-csv", "fixtures", "shopee-report.csv");
const csvContent = fs.readFileSync(filePath, "utf-8");

const parsedReport = parseShopeeCsv(csvContent);
const normalizedCampaigns = normalizeShopeeCampaigns(parsedReport.campaigns);

console.log("========== NORMALIZED CAMPAIGN ==========");
console.log(normalizedCampaigns[0]);
