import { prisma } from "@/server/database/prisma";
import { PlatformCode } from "@/server/core/import/import.types";

export async function getCampaignDashboardRepository(platformCode: PlatformCode) {
    const platform = await prisma.platform.findUnique({
        where: { code: platformCode },
    });

    if (!platform) {
        return null;
    }

    const [campaigns, importJobs] = await Promise.all([
        prisma.campaign.findMany({
            where: { platformId: platform.id },
            include: { reportMetrics: true },
            orderBy: { campaignName: "asc" },
        }),

        prisma.importJob.findMany({
            where: { platformId: platform.id, status: "COMPLETED" },
        }),
    ]);

    return { campaigns, importJobs };
}
