import type { BreakdownDimension, PlatformCode } from "@/server/core/etl/etl.types";

export type { BreakdownDimension, PlatformCode };

export interface AudienceBreakdownRow {
    dimensionValue: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    conversionsValue: number;
    ctr: number | null;
    cpa: number | null;
}

export interface AudienceBreakdownResponse {
    hasSyncedBefore: boolean;
    hasDataInRange: boolean;
    dimension: BreakdownDimension;
    rows: AudienceBreakdownRow[];
    lastSyncedAt: string | null;
}

export interface SpendTrendPoint {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    conversionsValue: number;
}

export interface SpendTrendResponse {
    hasSyncedBefore: boolean;
    hasDataInRange: boolean;
    points: SpendTrendPoint[];
    lastSyncedAt: string | null;
}

export interface LeadRowDto {
    id: string;
    source: string;
    externalLeadId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
    createdAtExternal: string | null;
}

export interface LeadsSummary {
    total: number;
    byStatus: { status: string; count: number }[];
    bySource: { source: string; count: number }[];
}

export interface LeadsResponse {
    hasSyncedBefore: boolean;
    hasDataInRange: boolean;
    summary: LeadsSummary;
    leads: LeadRowDto[];
    lastSyncedAt: string | null;
}
