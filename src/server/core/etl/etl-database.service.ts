import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { formatDateParam } from "./etlDate.util";
import type {
    NormalizedEtlSyncResult,
    NormalizedLeadSyncResult,
    PlatformSyncResult,
} from "./etl.types";

type EtlMetrics = { impressions?: number; clicks?: number; spend?: number; reach?: number; frequency?: number; ctr?: number; cpc?: number; cpm?: number; conversions?: number; conversionsValue?: number; raw?: Record<string, unknown> };

// AdInsight has frequency/ctr/cpc/cpm columns; AdInsightBreakdown does not
// (see schema.prisma) -- these must stay two separate mappers, not one shared
// superset, or Prisma rejects the extra fields with "Unknown argument".
function metricsToRow(metrics: EtlMetrics) {
    return {
        impressions: metrics.impressions ?? null,
        clicks: metrics.clicks ?? null,
        spend: metrics.spend ?? null,
        reach: metrics.reach ?? null,
        frequency: metrics.frequency ?? null,
        ctr: metrics.ctr ?? null,
        cpc: metrics.cpc ?? null,
        cpm: metrics.cpm ?? null,
        conversions: metrics.conversions ?? null,
        conversionsValue: metrics.conversionsValue ?? null,
    };
}

function breakdownMetricsToRow(metrics: EtlMetrics) {
    return {
        impressions: metrics.impressions ?? null,
        clicks: metrics.clicks ?? null,
        spend: metrics.spend ?? null,
        reach: metrics.reach ?? null,
        conversions: metrics.conversions ?? null,
        conversionsValue: metrics.conversionsValue ?? null,
    };
}

function toPrismaJson(raw: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
    return raw as Prisma.InputJsonValue | undefined;
}

/**
 * ETL analog of import.service.ts's saveImportResult -- but upsert-by-natural-key
 * instead of reject-on-overlap, because the daily job legitimately reruns for
 * the same date on retry/backfill (see AGENTS/plan notes on idempotency).
 */
export async function saveEtlSyncResult(
    companyId: bigint,
    result: NormalizedEtlSyncResult,
    options: { dryRun?: boolean } = {},
): Promise<PlatformSyncResult> {
    if (options.dryRun) {
        return {
            status: "synced",
            reason: "dry_run",
            counts: {
                campaigns: result.campaigns.length,
                adSets: result.adSets.length,
                ads: result.ads.length,
                posts: result.posts.length,
                insights: result.insights.length,
                breakdowns: result.breakdowns.length,
            },
        };
    }

    await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            const platform = await tx.platform.upsert({
                where: { code: result.platformCode },
                update: {},
                create: { code: result.platformCode, name: result.platformCode },
            });

            const importJob = await tx.importJob.create({
                data: {
                    companyId,
                    platformId: platform.id,
                    filename: `etl:${result.platformCode}:${formatDateParam(result.syncDate)}`,
                    reportName: "Daily ETL sync",
                    reportStartDate: result.syncDate,
                    reportEndDate: result.syncDate,
                    totalRecords: result.insights.length + result.breakdowns.length,
                    status: "PROCESSING",
                    source: "API",
                },
            });

            const campaignIdByExternalId = new Map<string, bigint>();
            for (const campaign of result.campaigns) {
                const saved = await tx.campaign.upsert({
                    where: {
                        companyId_platformId_externalCampaignId: {
                            companyId,
                            platformId: platform.id,
                            externalCampaignId: campaign.externalCampaignId,
                        },
                    },
                    update: { campaignName: campaign.name, campaignStatus: campaign.status },
                    create: {
                        companyId,
                        platformId: platform.id,
                        externalCampaignId: campaign.externalCampaignId,
                        campaignName: campaign.name,
                        campaignStatus: campaign.status,
                    },
                });
                campaignIdByExternalId.set(campaign.externalCampaignId, saved.id);
            }

            const adSetIdByExternalId = new Map<string, bigint>();
            for (const adSet of result.adSets) {
                const campaignId = campaignIdByExternalId.get(adSet.externalCampaignId);
                if (!campaignId) continue; // orphaned reference from the platform API -- skip rather than fail the whole sync

                const saved = await tx.adSet.upsert({
                    where: {
                        companyId_platformId_externalAdSetId: {
                            companyId,
                            platformId: platform.id,
                            externalAdSetId: adSet.externalAdSetId,
                        },
                    },
                    update: { name: adSet.name, status: adSet.status, campaignId },
                    create: {
                        companyId,
                        platformId: platform.id,
                        campaignId,
                        externalAdSetId: adSet.externalAdSetId,
                        name: adSet.name,
                        status: adSet.status,
                    },
                });
                adSetIdByExternalId.set(adSet.externalAdSetId, saved.id);
            }

            const postIdByExternalId = new Map<string, bigint>();
            for (const post of result.posts) {
                const saved = await tx.adPost.upsert({
                    where: {
                        companyId_platformId_externalPostId: {
                            companyId,
                            platformId: platform.id,
                            externalPostId: post.externalPostId,
                        },
                    },
                    update: {
                        message: post.message,
                        permalink: post.permalink,
                        publishedAt: post.publishedAt,
                        likeCount: post.likeCount ?? null,
                        commentCount: post.commentCount ?? null,
                        shareCount: post.shareCount ?? null,
                    },
                    create: {
                        companyId,
                        platformId: platform.id,
                        externalPostId: post.externalPostId,
                        message: post.message,
                        permalink: post.permalink,
                        publishedAt: post.publishedAt,
                        likeCount: post.likeCount ?? null,
                        commentCount: post.commentCount ?? null,
                        shareCount: post.shareCount ?? null,
                    },
                });
                postIdByExternalId.set(post.externalPostId, saved.id);
            }

            const adIdByExternalId = new Map<string, bigint>();
            for (const ad of result.ads) {
                const campaignId = campaignIdByExternalId.get(ad.externalCampaignId);
                const adSetId = adSetIdByExternalId.get(ad.externalAdSetId);
                if (!campaignId || !adSetId) continue;

                const postId = ad.externalPostId ? postIdByExternalId.get(ad.externalPostId) : undefined;

                const saved = await tx.ad.upsert({
                    where: {
                        companyId_platformId_externalAdId: {
                            companyId,
                            platformId: platform.id,
                            externalAdId: ad.externalAdId,
                        },
                    },
                    update: { name: ad.name, status: ad.status, creativeId: ad.creativeId, postId, campaignId, adSetId },
                    create: {
                        companyId,
                        platformId: platform.id,
                        campaignId,
                        adSetId,
                        externalAdId: ad.externalAdId,
                        name: ad.name,
                        status: ad.status,
                        creativeId: ad.creativeId,
                        postId,
                    },
                });
                adIdByExternalId.set(ad.externalAdId, saved.id);
            }

            const resolveEntityId = (entityLevel: string, externalEntityId: string): bigint | undefined => {
                if (entityLevel === "CAMPAIGN") return campaignIdByExternalId.get(externalEntityId);
                if (entityLevel === "ADSET") return adSetIdByExternalId.get(externalEntityId);
                return adIdByExternalId.get(externalEntityId);
            };

            for (const insight of result.insights) {
                const entityId = resolveEntityId(insight.entityLevel, insight.externalEntityId);
                const campaignId = campaignIdByExternalId.get(insight.externalCampaignId);
                if (!entityId || !campaignId) continue;

                await tx.adInsight.upsert({
                    where: {
                        companyId_platformId_entityLevel_entityId_date: {
                            companyId,
                            platformId: platform.id,
                            entityLevel: insight.entityLevel,
                            entityId,
                            date: insight.date,
                        },
                    },
                    update: { importJobId: importJob.id, campaignId, ...metricsToRow(insight.metrics), raw: toPrismaJson(insight.metrics.raw) },
                    create: {
                        companyId,
                        platformId: platform.id,
                        importJobId: importJob.id,
                        entityLevel: insight.entityLevel,
                        entityId,
                        campaignId,
                        date: insight.date,
                        ...metricsToRow(insight.metrics),
                        raw: toPrismaJson(insight.metrics.raw),
                    },
                });
            }

            for (const breakdown of result.breakdowns) {
                const entityId = resolveEntityId(breakdown.entityLevel, breakdown.externalEntityId);
                const campaignId = campaignIdByExternalId.get(breakdown.externalCampaignId);
                if (!entityId || !campaignId) continue;

                await tx.adInsightBreakdown.upsert({
                    where: {
                        companyId_platformId_entityLevel_entityId_date_dimensionType_dimensionValue: {
                            companyId,
                            platformId: platform.id,
                            entityLevel: breakdown.entityLevel,
                            entityId,
                            date: breakdown.date,
                            dimensionType: breakdown.dimensionType,
                            dimensionValue: breakdown.dimensionValue,
                        },
                    },
                    update: { importJobId: importJob.id, campaignId, ...breakdownMetricsToRow(breakdown.metrics) },
                    create: {
                        companyId,
                        platformId: platform.id,
                        importJobId: importJob.id,
                        entityLevel: breakdown.entityLevel,
                        entityId,
                        campaignId,
                        date: breakdown.date,
                        dimensionType: breakdown.dimensionType,
                        dimensionValue: breakdown.dimensionValue,
                        ...breakdownMetricsToRow(breakdown.metrics),
                    },
                });
            }

            await tx.importJob.update({
                where: { id: importJob.id },
                data: { status: "COMPLETED", importedAt: new Date() },
            });
        },
        { timeout: 60000 },
    );

    return {
        status: "synced",
        counts: {
            campaigns: result.campaigns.length,
            adSets: result.adSets.length,
            ads: result.ads.length,
            posts: result.posts.length,
            insights: result.insights.length,
            breakdowns: result.breakdowns.length,
        },
    };
}

export async function saveEtlLeads(
    companyId: bigint,
    result: NormalizedLeadSyncResult,
    options: { dryRun?: boolean } = {},
): Promise<{ created: number; updated: number }> {
    if (options.dryRun || result.leads.length === 0) {
        return { created: 0, updated: 0 };
    }

    let created = 0;
    let updated = 0;

    await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            const platform = await tx.platform.upsert({
                where: { code: result.platformCode },
                update: {},
                create: { code: result.platformCode, name: result.platformCode },
            });

            for (const lead of result.leads) {
                const campaign = lead.externalCampaignId
                    ? await tx.campaign.findUnique({
                          where: {
                              companyId_platformId_externalCampaignId: {
                                  companyId,
                                  platformId: platform.id,
                                  externalCampaignId: lead.externalCampaignId,
                              },
                          },
                      })
                    : null;

                const ad = lead.externalAdId
                    ? await tx.ad.findUnique({
                          where: {
                              companyId_platformId_externalAdId: {
                                  companyId,
                                  platformId: platform.id,
                                  externalAdId: lead.externalAdId,
                              },
                          },
                      })
                    : null;

                const existing = await tx.lead.findUnique({
                    where: {
                        companyId_platformId_externalLeadId: {
                            companyId,
                            platformId: platform.id,
                            externalLeadId: lead.externalLeadId,
                        },
                    },
                });

                await tx.lead.upsert({
                    where: {
                        companyId_platformId_externalLeadId: {
                            companyId,
                            platformId: platform.id,
                            externalLeadId: lead.externalLeadId,
                        },
                    },
                    update: {
                        campaignId: campaign?.id,
                        adId: ad?.id,
                        formId: lead.formId,
                        fullName: lead.fullName,
                        email: lead.email,
                        phone: lead.phone,
                        status: lead.status,
                        raw: toPrismaJson(lead.raw),
                    },
                    create: {
                        companyId,
                        platformId: platform.id,
                        campaignId: campaign?.id,
                        adId: ad?.id,
                        source: lead.source,
                        externalLeadId: lead.externalLeadId,
                        formId: lead.formId,
                        fullName: lead.fullName,
                        email: lead.email,
                        phone: lead.phone,
                        status: lead.status,
                        createdAtExternal: lead.createdAtExternal,
                        raw: toPrismaJson(lead.raw),
                    },
                });

                if (existing) updated += 1;
                else created += 1;
            }
        },
        { timeout: 60000 },
    );

    return { created, updated };
}
