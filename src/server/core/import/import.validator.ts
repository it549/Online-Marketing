import { NormalizedImportResult, } from "./import.types";

export function validateImportResult(result: NormalizedImportResult,): void {
    if (result.campaigns.length === 0) {
        throw new Error("ไม่พบข้อมูล Campaign ในไฟล์",);
    }

    if (!result.report.reportStartDate) {
        throw new Error("ไม่พบวันที่เริ่มต้นของ Report",);
    }

    if (!result.report.reportEndDate) {
        throw new Error("ไม่พบวันที่สิ้นสุดของ Report",);
    }

    for (const campaign of result.campaigns) {
        if (!campaign.campaignName) {
            throw new Error("Campaign Name ต้องไม่เป็นค่าว่าง",);
        }

        if (!campaign.externalCampaignId) {
            throw new Error("External Campaign ID ต้องไม่เป็นค่าว่าง",);
        }
    }
}