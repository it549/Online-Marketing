import type { CompanyPlatformId } from "@/types/company";
import type { AudienceBreakdownResponse, BreakdownDimension, LeadsResponse, LeadsSummary, PlatformCode, SpendTrendResponse } from "@/types/insights";
import {
    getAdInsightBreakdownRepository,
    getAdInsightTrendRepository,
    getLastLeadSyncedAtRepository,
    getLastSyncedRepository,
    getLeadsForSummaryRepository,
    getLeadsRepository,
    getPlatformRepository,
    hasAnyInsightDataRepository,
    hasAnyLeadDataRepository,
} from "./insights.repository";
import { buildLeadsSummary, mapAudienceBreakdown, mapLeads, mapSpendTrend } from "./insights.mapper";

export const PLATFORM_CODE_BY_ID: Record<CompanyPlatformId, PlatformCode> = {
    facebook: "META",
    shopee: "SHOPEE",
    tiktok: "TIKTOK",
    googleAds: "GOOGLE_ADS",
};

export async function getAudienceBreakdown(
    companyId: bigint,
    platform: CompanyPlatformId,
    dimension: BreakdownDimension,
    dateFrom: Date,
    dateTo: Date,
): Promise<AudienceBreakdownResponse> {
    const platformRow = await getPlatformRepository(PLATFORM_CODE_BY_ID[platform]);

    if (!platformRow) {
        return { hasSyncedBefore: false, hasDataInRange: false, dimension, rows: [], lastSyncedAt: null };
    }

    const [hasSyncedBefore, lastSynced, rows] = await Promise.all([
        hasAnyInsightDataRepository(companyId, platformRow.id),
        getLastSyncedRepository(companyId, platformRow.id),
        getAdInsightBreakdownRepository(companyId, platformRow.id, dimension, dateFrom, dateTo),
    ]);

    return mapAudienceBreakdown(dimension, hasSyncedBefore, lastSynced?.importedAt ?? null, rows);
}

export async function getSpendTrend(
    companyId: bigint,
    platform: CompanyPlatformId,
    dateFrom: Date,
    dateTo: Date,
): Promise<SpendTrendResponse> {
    const platformRow = await getPlatformRepository(PLATFORM_CODE_BY_ID[platform]);

    if (!platformRow) {
        return { hasSyncedBefore: false, hasDataInRange: false, points: [], lastSyncedAt: null };
    }

    const [hasSyncedBefore, lastSynced, rows] = await Promise.all([
        hasAnyInsightDataRepository(companyId, platformRow.id),
        getLastSyncedRepository(companyId, platformRow.id),
        getAdInsightTrendRepository(companyId, platformRow.id, dateFrom, dateTo),
    ]);

    return mapSpendTrend(hasSyncedBefore, lastSynced?.importedAt ?? null, rows);
}

export async function getLeads(
    companyId: bigint,
    platform: CompanyPlatformId | undefined,
    dateFrom?: Date,
    dateTo?: Date,
): Promise<LeadsResponse> {
    const platformRow = platform ? await getPlatformRepository(PLATFORM_CODE_BY_ID[platform]) : null;
    const platformId = platformRow?.id;

    const [hasSyncedBefore, lastSyncedAt, leads] = await Promise.all([
        hasAnyLeadDataRepository(companyId, platformId),
        getLastLeadSyncedAtRepository(companyId, platformId),
        getLeadsRepository(companyId, platformId, dateFrom, dateTo),
    ]);

    return mapLeads(hasSyncedBefore, lastSyncedAt, leads);
}

export interface LeadsSummaryOnly {
    hasSyncedBefore: boolean;
    hasDataInRange: boolean;
    summary: LeadsSummary;
    lastSyncedAt: string | null;
}

// PII-safe: only ever touches getLeadsForSummaryRepository (which selects
// source/status only) -- never the full-row getLeadsRepository. This is the
// only leads-reading function the AI recommendation module is allowed to call.
export async function getLeadsSummaryOnly(
    companyId: bigint,
    platform: CompanyPlatformId | undefined,
    dateFrom?: Date,
    dateTo?: Date,
): Promise<LeadsSummaryOnly> {
    const platformRow = platform ? await getPlatformRepository(PLATFORM_CODE_BY_ID[platform]) : null;
    const platformId = platformRow?.id;

    const [hasSyncedBefore, lastSynced, leads] = await Promise.all([
        hasAnyLeadDataRepository(companyId, platformId),
        getLastLeadSyncedAtRepository(companyId, platformId),
        getLeadsForSummaryRepository(companyId, platformId, dateFrom, dateTo),
    ]);

    return {
        hasSyncedBefore,
        hasDataInRange: leads.length > 0,
        summary: buildLeadsSummary(leads),
        lastSyncedAt: lastSynced ? lastSynced.toISOString() : null,
    };
}
