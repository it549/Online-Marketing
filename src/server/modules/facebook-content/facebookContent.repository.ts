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
