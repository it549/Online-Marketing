import type { Company } from "@prisma/client";
import { listCompanies } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import type { CompanyPlatformId } from "@/types/company";
import type { PlatformLeadSyncer, PlatformSyncer } from "./etl.types";
import { syncFacebookAdsForCompany } from "@/server/modules/facebook/facebookEtl.service";
import { syncGoogleAdsForCompany } from "@/server/modules/google-ads/googleAdsEtl.service";
import { syncShopeeAdsForCompany } from "@/server/modules/shopee/shopeeEtl.service";
import { syncFacebookLeadsForCompany } from "@/server/modules/facebook/facebookLead.service";
import { syncGoogleLocalServicesLeadsForCompany } from "@/server/modules/google-ads/googleLocalServicesLead.service";
import { syncTikTokAdsForCompany } from "@/server/modules/tiktok/tiktokEtl.service";

// Company/platform iteration is driven entirely by listCompanies() +
// Company.platforms -- adding a company, or toggling a platform for one, is a
// zero-code-change operation. (TikTok's syncer is wired in but always
// self-skips today -- see tiktokEtl.service.ts.)
export const AD_INSIGHT_SYNCERS: Record<CompanyPlatformId, PlatformSyncer> = {
    facebook: syncFacebookAdsForCompany,
    googleAds: syncGoogleAdsForCompany,
    tiktok: syncTikTokAdsForCompany,
    shopee: syncShopeeAdsForCompany,
};

export const LEAD_SYNCERS: Partial<Record<CompanyPlatformId, PlatformLeadSyncer>> = {
    facebook: syncFacebookLeadsForCompany,
    googleAds: syncGoogleLocalServicesLeadsForCompany,
};

export interface EtlRunResult {
    companyId: string;
    companyCode: string;
    platform: CompanyPlatformId;
    status: string;
    reason?: string;
    error?: string;
    durationMs: number;
}

export interface EtlRunSummary {
    targetDate: Date;
    totalCompanies: number;
    results: EtlRunResult[];
}

async function runForEachCompanyPlatform<TResult extends { status: string; reason?: string }>(
    syncers: Partial<Record<CompanyPlatformId, (company: Company, date: Date, options?: { dryRun?: boolean }) => Promise<TResult>>>,
    date: Date,
    options: { dryRun?: boolean } = {},
): Promise<EtlRunSummary> {
    const companies = await listCompanies();
    const results: EtlRunResult[] = [];

    for (const company of companies) {
        const enabledPlatforms = parseCompanyPlatforms(company.platforms);

        for (const platform of enabledPlatforms) {
            const syncer = syncers[platform];
            if (!syncer) continue;

            const started = Date.now();
            try {
                const result = await syncer(company, date, options);
                results.push({
                    companyId: company.id.toString(),
                    companyCode: company.code,
                    platform,
                    status: result.status,
                    reason: result.reason,
                    durationMs: Date.now() - started,
                });
            } catch (error) {
                // Deliberately not rethrown -- one company/platform failure must not block the rest of the run.
                results.push({
                    companyId: company.id.toString(),
                    companyCode: company.code,
                    platform,
                    status: "failed",
                    error: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - started,
                });
            }
        }
    }

    return { targetDate: date, totalCompanies: companies.length, results };
}

export async function runDailyEtlSync(targetDate: Date, options: { dryRun?: boolean } = {}): Promise<EtlRunSummary> {
    return runForEachCompanyPlatform(AD_INSIGHT_SYNCERS, targetDate, options);
}

export async function runDailyLeadSync(sinceDate: Date, options: { dryRun?: boolean } = {}): Promise<EtlRunSummary> {
    return runForEachCompanyPlatform(LEAD_SYNCERS, sinceDate, options);
}

/**
 * On-demand sync for a single company/platform (the Insights page's "sync now" button),
 * as opposed to runDailyEtlSync which sweeps every company/platform on the cron schedule.
 * Runs the syncer once per date given -- callers decide which dates matter (e.g. today +
 * yesterday, to get a fresher same-day picture while also correcting yesterday's numbers
 * in case of late attribution).
 */
export async function runManualEtlSync(company: Company, platform: CompanyPlatformId, dates: Date[]): Promise<EtlRunResult[]> {
    const syncer = AD_INSIGHT_SYNCERS[platform];
    const results: EtlRunResult[] = [];

    for (const date of dates) {
        const started = Date.now();
        try {
            const result = await syncer(company, date);
            results.push({
                companyId: company.id.toString(),
                companyCode: company.code,
                platform,
                status: result.status,
                reason: result.reason,
                durationMs: Date.now() - started,
            });
        } catch (error) {
            results.push({
                companyId: company.id.toString(),
                companyCode: company.code,
                platform,
                status: "failed",
                error: error instanceof Error ? error.message : String(error),
                durationMs: Date.now() - started,
            });
        }
    }

    return results;
}
