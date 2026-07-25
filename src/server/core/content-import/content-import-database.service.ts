import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { NormalizedContentImportResult } from "./content-import.types";

export async function saveContentImportResult(result: NormalizedContentImportResult, fileName: string) {
    return prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            const platform = await tx.contentPlatform.upsert({
                where: { code: result.platformCode },
                update: {},
                create: {
                    code: result.platformCode,
                    name: result.platformCode,
                },
            });

            const importJob = await tx.contentImportJob.create({
                data: {
                    platformId: platform.id,
                    filename: fileName,
                    rangeStartDate: result.rangeStartDate,
                    rangeEndDate: result.rangeEndDate,
                    totalRecords: result.posts.length,
                    status: "PROCESSING",
                },
            });

            // Each export re-states every post's LIFETIME totals to date, so a
            // re-import must overwrite the post's single metric snapshot, not
            // add to it -- unlike Shopee's periodic ad reports, there is no
            // overlap to reject here, upserting is always correct.
            for (const post of result.posts) {
                const savedPost = await tx.contentPost.upsert({
                    where: {
                        platformId_externalPostId: {
                            platformId: platform.id,
                            externalPostId: post.externalPostId,
                        },
                    },

                    update: {
                        pageExternalId: post.pageExternalId,
                        pageName: post.pageName,
                        title: post.title,
                        postType: post.postType,
                        permalink: post.permalink,
                        publishedAt: post.publishedAt,
                        durationSeconds: post.durationSeconds,
                        lastImportJobId: importJob.id,
                    },

                    create: {
                        platformId: platform.id,
                        externalPostId: post.externalPostId,
                        pageExternalId: post.pageExternalId,
                        pageName: post.pageName,
                        title: post.title,
                        postType: post.postType,
                        permalink: post.permalink,
                        publishedAt: post.publishedAt,
                        durationSeconds: post.durationSeconds,
                        lastImportJobId: importJob.id,
                    },
                });

                await tx.contentPostMetric.upsert({
                    where: { postId: savedPost.id },
                    update: { ...post.metrics },
                    create: { postId: savedPost.id, ...post.metrics },
                });
            }

            return tx.contentImportJob.update({
                where: { id: importJob.id },
                data: {
                    status: "COMPLETED",
                    importedAt: new Date(),
                },
            });
        },

        {
            timeout: 30000,
        },
    );
}
