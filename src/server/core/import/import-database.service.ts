import { prisma, } from "@/server/database/prisma";
import { NormalizedImportResult, } from "./import.types";

export async function saveImportResult(result: NormalizedImportResult, fileName: string,) {
    return prisma.$transaction(
        async (tx: any) => {
            const platform = await tx.platform.upsert({
                where: { code: result.platformCode, },
                update: {},
                create: {
                    code: result.platformCode,
                    name: result.platformCode,
                },
            },);

            // Reject any import whose report period overlaps one already saved
            // for this platform -- not just an exact date match. Shopee (and
            // most ad platforms) export rolling "trailing N days" windows, so
            // re-downloading the same report a day later produces a DIFFERENT
            // but overlapping date range; an exact-match check alone would
            // miss that and silently double-count the overlapping days.
            const overlappingImport = await tx.importJob.findFirst({
                where: {
                    platformId: platform.id,
                    status: "COMPLETED",
                    reportStartDate: { lte: result.report.reportEndDate, },
                    reportEndDate: { gte: result.report.reportStartDate, },
                },
            },);

            if (overlappingImport) {
                throw new Error(
                    `ช่วงเวลานี้ทับซ้อนกับข้อมูลที่นำเข้าไปแล้ว (ไฟล์ "${overlappingImport.filename}", ${overlappingImport.reportStartDate.toLocaleDateString("th-TH",)} - ${overlappingImport.reportEndDate.toLocaleDateString("th-TH",)}) กรุณาเลือกไฟล์รายงานช่วงเวลาอื่นที่ไม่ทับซ้อน`,
                );
            }

            const importJob = await tx.importJob.create({
                data: {
                    platformId: platform.id,
                    filename: fileName,
                    reportName: result.report.reportName,
                    reportStartDate: result.report.reportStartDate,
                    reportEndDate: result.report.reportEndDate,
                    totalRecords: result.report.totalRecords,
                    status: "PROCESSING",
                },
            });

            for (const campaign of result.campaigns) {
                const savedCampaign = await tx.campaign.upsert({
                    where: {
                        platformId_externalCampaignId: {
                            platformId: platform.id,
                            externalCampaignId: campaign.externalCampaignId,
                        },
                    },

                    update: {
                        campaignName: campaign.campaignName,
                        campaignStatus: campaign.campaignStatus,
                        adType: campaign.adType,
                        productId: campaign.productId,
                        bidStrategy: campaign.bidStrategy,
                        placement: campaign.placement,
                        startDate: campaign.startDate,
                        endDate: campaign.endDate,
                    },

                    create: {
                        platformId: platform.id,
                        externalCampaignId: campaign.externalCampaignId,
                        campaignName: campaign.campaignName,
                        campaignStatus: campaign.campaignStatus,
                        adType: campaign.adType,
                        productId: campaign.productId,
                        bidStrategy: campaign.bidStrategy,
                        placement: campaign.placement,
                        startDate: campaign.startDate,
                        endDate: campaign.endDate,
                    },
                });

                await tx.campaignReportMetric.create({
                    data: {
                        campaignId: savedCampaign.id,
                        importJobId: importJob.id,
                        reportStartDate: result.report.reportStartDate,
                        reportEndDate: result.report.reportEndDate, ...campaign.metrics,
                    },
                });
            }

            return tx.importJob.update({
                where: {
                    id: importJob.id,
                },

                data: {
                    status: "COMPLETED",
                    importedAt: new Date(),
                },
            });
        },

        {
            timeout: 30000,
        },
    );
}