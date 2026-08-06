import { prisma } from "@/server/database/prisma";

const FACEBOOK_CONTENT_PLATFORM_CODE = "FACEBOOK";

export async function getFacebookContentRepository(companyId: bigint, importJobId?: string) {
    const platform = await prisma.contentPlatform.findUnique({
        where: { code: FACEBOOK_CONTENT_PLATFORM_CODE },
    });

    if (!platform) {
        return null;
    }

    const posts = await prisma.contentPost.findMany({
        where: {
            companyId,
            platformId: platform.id,
            ...(importJobId ? { lastImportJobId: BigInt(importJobId) } : {}),
        },
        include: { metric: true },
    });

    return posts;
}

export async function listFacebookContentImportJobs(companyId: bigint) {
    const platform = await prisma.contentPlatform.findUnique({
        where: { code: FACEBOOK_CONTENT_PLATFORM_CODE },
    });

    if (!platform) {
        return [];
    }

    return prisma.contentImportJob.findMany({
        where: { companyId, platformId: platform.id, status: "COMPLETED" },
        orderBy: { importedAt: "desc" },
    });
}

/**
 * Cross-references content posts (imported from CSV) against ad_posts (pulled
 * via the ads ETL, see facebookEtl.service.ts's resolveFacebookAdPosts) by
 * Facebook's post id -- both tables key on the same real-world post, just
 * reached through different pipelines, so no shared FK exists between them.
 */
export async function getAdvertisedExternalPostIds(companyId: bigint, externalPostIds: string[]): Promise<Set<string>> {
    if (externalPostIds.length === 0) return new Set();

    const rows = await prisma.adPost.findMany({
        where: { companyId, externalPostId: { in: externalPostIds } },
        select: { externalPostId: true },
    });

    return new Set(rows.map((row) => row.externalPostId));
}
