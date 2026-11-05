require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
    const prisma = new PrismaClient();

    try {
        // META_ACCESS_TOKEN / META_AD_ACCOUNT_ID in .env belong to the "Nilaphatra-bot" ad
        // account (confirmed via Graph API), i.e. company 2, not รังสิโย. รังสิโย has no
        // Facebook credentials of its own yet, so its fields stay cleared.
        const rungsiyo = await prisma.company.upsert({
            where: { code: "rungsiyo" },
            update: {
                platforms: ["facebook", "shopee", "tiktok"],
                facebookAdAccountId: null,
                facebookAccessToken: null,
            },
            create: { name: "รังสิโย", code: "rungsiyo", platforms: ["facebook", "shopee", "tiktok"] },
        });

        // Nilaphatra has no Shopee data -- it only runs Facebook, TikTok, and (once
        // credentials are wired up) Google Ads.
        const nilaphatra = await prisma.company.upsert({
            where: { code: "company-2" },
            update: {
                name: "Nilaphatra",
                platforms: ["facebook", "tiktok", "googleAds"],
                facebookAdAccountId: process.env.META_AD_ACCOUNT_ID ?? null,
                facebookAccessToken: process.env.META_ACCESS_TOKEN ?? null,
            },
            create: {
                name: "Nilaphatra",
                code: "company-2",
                platforms: ["facebook", "tiktok", "googleAds"],
                facebookAdAccountId: process.env.META_AD_ACCOUNT_ID ?? null,
                facebookAccessToken: process.env.META_ACCESS_TOKEN ?? null,
            },
        });

        console.log(`Company ready: ${rungsiyo.name} (id ${rungsiyo.id})`);
        console.log(`Company ready: ${nilaphatra.name} (id ${nilaphatra.id})`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
