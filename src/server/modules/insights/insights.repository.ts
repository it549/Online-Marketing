import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";

export async function getPlatformRepository(platformCode: string) {
    return prisma.platform.findUnique({ where: { code: platformCode } });
}

export async function getAdInsightTrendRepository(companyId: bigint, platformId: bigint, dateFrom: Date, dateTo: Date) {
    return prisma.adInsight.findMany({
        where: { companyId, platformId, entityLevel: "CAMPAIGN", date: { gte: dateFrom, lte: dateTo } },
        orderBy: { date: "asc" },
    });
}

export async function getAdInsightBreakdownRepository(
    companyId: bigint,
    platformId: bigint,
    dimensionType: string,
    dateFrom: Date,
    dateTo: Date,
) {
    return prisma.adInsightBreakdown.findMany({
        where: { companyId, platformId, dimensionType, date: { gte: dateFrom, lte: dateTo } },
    });
}

export async function getLeadsRepository(companyId: bigint, platformId: bigint | undefined, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LeadWhereInput = { companyId };
    if (platformId) where.platformId = platformId;

    if (dateFrom || dateTo) {
        where.createdAtExternal = {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
        };
    }

    return prisma.lead.findMany({ where, orderBy: { createdAtExternal: "desc" } });
}

export async function getLastSyncedRepository(companyId: bigint, platformId: bigint) {
    return prisma.importJob.findFirst({
        where: { companyId, platformId, source: "API", status: "COMPLETED" },
        orderBy: { importedAt: "desc" },
    });
}

export async function hasAnyInsightDataRepository(companyId: bigint, platformId: bigint) {
    const row = await prisma.adInsight.findFirst({ where: { companyId, platformId }, select: { id: true } });
    return row !== null;
}

export async function hasAnyLeadDataRepository(companyId: bigint, platformId?: bigint) {
    const row = await prisma.lead.findFirst({
        where: { companyId, ...(platformId ? { platformId } : {}) },
        select: { id: true },
    });
    return row !== null;
}

// Selects only aggregate-safe fields (no fullName/email/phone/raw) -- used by the
// AI recommendation module, which must never see PII, enforced here at the query
// level rather than relying on the caller to ignore fields it shouldn't touch.
export async function getLeadsForSummaryRepository(companyId: bigint, platformId: bigint | undefined, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LeadWhereInput = { companyId };
    if (platformId) where.platformId = platformId;

    if (dateFrom || dateTo) {
        where.createdAtExternal = {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
        };
    }

    return prisma.lead.findMany({ where, select: { source: true, status: true } });
}

// Lead ETL (hourly, see etl-database.service.ts::saveEtlLeads) doesn't create ImportJob
// rows like the ads-insights ETL does -- our own row-insert time is the best available
// "last synced" proxy for the Leads tab.
export async function getLastLeadSyncedAtRepository(companyId: bigint, platformId?: bigint) {
    const row = await prisma.lead.findFirst({
        where: { companyId, ...(platformId ? { platformId } : {}) },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });
    return row?.createdAt ?? null;
}
