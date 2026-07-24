import fs from "node:fs";
import path from "node:path";

import { parseShopeeCsv } from "@/server/modules/shopee/shopee-csv.parser";

const filePath = path.join(process.cwd(), "src", "tests", "import-csv", "fixtures", "shopee-report.csv");
const csvContent = fs.readFileSync(filePath, "utf-8");

const result = parseShopeeCsv(csvContent);

console.log("========== METADATA ==========");
console.log(result.metadata);

console.log("========== CAMPAIGN COUNT ==========");
console.log(result.campaigns.length);

console.log("========== FIRST CAMPAIGN ==========");
console.log(result.campaigns[0]);
