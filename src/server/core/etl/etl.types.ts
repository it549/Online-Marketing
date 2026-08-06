import type { Company } from "@prisma/client";
import type { PlatformCode } from "@/server/core/import/import.types";

export type { PlatformCode } from "@/server/core/import/import.types";

export type EntityLevel = "CAMPAIGN" | "ADSET" | "AD";
export type LeadSource = "FACEBOOK_LEAD_ADS" | "GOOGLE_LOCAL_SERVICES";

// Extend this union to add a new breakdown dimension -- no migration needed,
// AdInsightBreakdown.dimensionType is a plain string column.
export type BreakdownDimension = "AGE" | "GENDER" | "REGION" | "PUBLISHER_PLATFORM" | "PLATFORM_POSITION";

export interface NormalizedCampaignRef {
    platformCode: PlatformCode;
    externalCampaignId: string;
    name: string;
    status: string;
}

export interface NormalizedAdSet {
    platformCode: PlatformCode;
    externalAdSetId: string;
    externalCampaignId: string;
    name: string;
    status: string;
}

export interface NormalizedAd {
    platformCode: PlatformCode;
    externalAdId: string;
    externalAdSetId: string;
    externalCampaignId: string;
    name: string;
    status: string;
    creativeId?: string;
    externalPostId?: string;
}

// The post an ad is boosting -- resolved separately from NormalizedAd because
// several ads can point at the same post (dedupe by externalPostId on save).
export interface NormalizedPost {
    platformCode: PlatformCode;
    externalPostId: string;
    message?: string;
    permalink?: string;
    publishedAt?: Date;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
}

export interface NormalizedInsightMetrics {
    impressions?: number;
    clicks?: number;
    spend?: number;
    reach?: number;
    frequency?: number;
    ctr?: number;
    cpc?: number;
    cpm?: number;
    conversions?: number;
    conversionsValue?: number;
    raw?: Record<string, unknown>;
}

export interface NormalizedInsight {
    platformCode: PlatformCode;
    entityLevel: EntityLevel;
    externalEntityId: string;
    externalCampaignId: string;
    date: Date;
    metrics: NormalizedInsightMetrics;
}

export interface NormalizedBreakdownInsight {
    platformCode: PlatformCode;
    entityLevel: EntityLevel;
    externalEntityId: string;
    externalCampaignId: string;
    date: Date;
    dimensionType: BreakdownDimension;
    dimensionValue: string;
    metrics: NormalizedInsightMetrics;
}

export interface NormalizedLead {
    platformCode: PlatformCode;
    source: LeadSource;
    externalLeadId: string;
    externalCampaignId?: string;
    externalAdId?: string;
    formId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    status?: string;
    createdAtExternal?: Date;
    raw?: Record<string, unknown>;
}

export interface NormalizedEtlSyncResult {
    platformCode: PlatformCode;
    syncDate: Date;
    campaigns: NormalizedCampaignRef[];
    adSets: NormalizedAdSet[];
    ads: NormalizedAd[];
    posts: NormalizedPost[];
    insights: NormalizedInsight[];
    breakdowns: NormalizedBreakdownInsight[];
}

export interface NormalizedLeadSyncResult {
    platformCode: PlatformCode;
    leads: NormalizedLead[];
}

// "skipped" covers: platform not enabled for the company, credentials missing,
// token expired, or (TikTok) API client not wired in yet. It is a normal,
// expected outcome -- not an error -- and must not throw.
export type PlatformSyncStatus = "synced" | "skipped" | "failed";

export interface PlatformSyncResult {
    status: PlatformSyncStatus;
    reason?: string;
    counts?: {
        campaigns: number;
        adSets: number;
        ads: number;
        posts: number;
        insights: number;
        breakdowns: number;
    };
}

export interface PlatformLeadSyncResult {
    status: PlatformSyncStatus;
    reason?: string;
    counts?: {
        leads: number;
    };
}

export type PlatformSyncer = (company: Company, targetDate: Date, options?: { dryRun?: boolean }) => Promise<PlatformSyncResult>;
export type PlatformLeadSyncer = (company: Company, sinceDate: Date, options?: { dryRun?: boolean }) => Promise<PlatformLeadSyncResult>;
