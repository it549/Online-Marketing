import { prisma } from "@/server/database/prisma";

const FACEBOOK_CONTENT_PLATFORM_CODE = "FACEBOOK";

export async function getFacebookContentRepository() {
    const platform = await prisma.contentPlatform.findUnique({
        where: { code: FACEBOOK_CONTENT_PLATFORM_CODE },
    });

    if (!platform) {
        return null;
    }

    const posts = await prisma.contentPost.findMany({
        where: { platformId: platform.id },
        include: { metric: true },
    });

    return posts;
}
