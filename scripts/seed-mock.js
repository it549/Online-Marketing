// Mock data for testing. Everything lives under company code "mock-demo", so real
// companies are never touched. Idempotent: re-running wipes and rebuilds that company.
//   npm run seed:mock          -> (re)create mock data
//   npm run seed:mock -- --clean -> remove mock data only
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const CODE = "mock-demo";
const DAYS = 30;

// deterministic PRNG so every run produces the same numbers
let seed = 20260101;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const int = (min, max) => Math.floor(min + rnd() * (max - min + 1));
const dec = (min, max, d = 2) => Number((min + rnd() * (max - min)).toFixed(d));
const pick = (arr) => arr[int(0, arr.length - 1)];

const dayAgo = (n) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - n);
    return d;
};

async function wipe(prisma, companyId) {
    const where = { companyId };
    await prisma.lead.deleteMany({ where });
    await prisma.adInsightBreakdown.deleteMany({ where });
    await prisma.adInsight.deleteMany({ where });
    await prisma.ad.deleteMany({ where });
    await prisma.adPost.deleteMany({ where });
    await prisma.adSet.deleteMany({ where });
    await prisma.campaignReportMetric.deleteMany({ where: { campaign: where } });
    await prisma.campaign.deleteMany({ where });
    await prisma.importJob.deleteMany({ where });
    await prisma.contentPostMetric.deleteMany({ where: { post: where } });
    await prisma.contentPost.deleteMany({ where });
    await prisma.contentImportJob.deleteMany({ where });
}

async function main() {
    const prisma = new PrismaClient();
    try {
        const existing = await prisma.company.findUnique({ where: { code: CODE } });
        if (existing) await wipe(prisma, existing.id);

        if (process.argv.includes("--clean")) {
            if (existing) await prisma.company.delete({ where: { id: existing.id } });
            console.log("Mock data removed.");
            return;
        }

        const company = await prisma.company.upsert({
            where: { code: CODE },
            update: {},
            create: { name: "Mock Demo", code: CODE, platforms: ["facebook", "shopee", "tiktok"] },
        });
        const companyId = company.id;

        const platform = (code, name) =>
            prisma.platform.upsert({ where: { code }, update: {}, create: { code, name } });
        const meta = await platform("META", "META");
        const tiktok = await platform("TIKTOK", "TIKTOK");
        const shopee = await platform("SHOPEE", "SHOPEE");

        // --- Facebook/TikTok ETL hierarchy + daily insights ---------------------
        const etlJob = await prisma.importJob.create({
            data: {
                companyId, platformId: meta.id, filename: "mock:etl", reportName: "Mock ETL",
                reportStartDate: dayAgo(DAYS - 1), reportEndDate: dayAgo(0),
                totalRecords: 0, status: "COMPLETED", source: "API", importedAt: new Date(),
            },
        });

        const posts = [];
        for (let i = 1; i <= 6; i++) {
            posts.push(await prisma.adPost.create({
                data: {
                    companyId, platformId: meta.id, externalPostId: `MOCK_PAGE_${i}`,
                    message: `โพสต์โปรโมชันทดสอบ #${i}`, permalink: `https://facebook.com/mock/posts/${i}`,
                    publishedAt: dayAgo(int(5, 40)), likeCount: int(20, 900),
                    commentCount: int(0, 120), shareCount: int(0, 80),
                },
            }));
        }

        const regions = ["Bangkok", "Chiang Mai", "Khon Kaen", "Phuket", "Songkhla"];
        const ages = ["18-24", "25-34", "35-44", "45-54", "55-64"];
        const genders = ["male", "female", "unknown"];
        const pubs = ["facebook", "instagram", "messenger", "audience_network"];
        const positions = ["feed", "story", "reels", "right_hand_column"];
        const statuses = ["ACTIVE", "ACTIVE", "PAUSED"];

        let adCounter = 0;
        let leadCounter = 0;
        const campaignDefs = [
            { p: meta, n: "Facebook - Brand Awareness" },
            { p: meta, n: "Facebook - Lead Gen" },
            { p: meta, n: "Facebook - Retargeting" },
            { p: tiktok, n: "TikTok - Spark Ads" },
            { p: tiktok, n: "TikTok - Traffic" },
        ];

        for (const [ci, def] of campaignDefs.entries()) {
            const campaign = await prisma.campaign.create({
                data: {
                    companyId, platformId: def.p.id, externalCampaignId: `MOCK_CMP_${ci + 1}`,
                    campaignName: def.n, campaignStatus: ci === 4 ? "PAUSED" : "ACTIVE",
                    startDate: dayAgo(DAYS), endDate: null,
                },
            });

            const insightRows = [];
            const breakdownRows = [];
            const pushInsight = (level, entityId, date, scale) => {
                const impressions = int(2000, 20000) * scale;
                const clicks = Math.round(impressions * dec(0.008, 0.04, 4));
                const spend = dec(150, 1200) * scale;
                const conversions = Math.round(clicks * dec(0.02, 0.12, 4));
                insightRows.push({
                    companyId, platformId: def.p.id, importJobId: etlJob.id,
                    entityLevel: level, entityId, campaignId: campaign.id, date,
                    impressions, clicks, spend, reach: Math.round(impressions * dec(0.6, 0.9)),
                    frequency: dec(1.1, 2.8, 4), ctr: Number(((clicks / impressions) * 100).toFixed(4)),
                    cpc: Number((spend / Math.max(clicks, 1)).toFixed(4)),
                    cpm: Number(((spend / impressions) * 1000).toFixed(4)),
                    conversions, conversionsValue: Number((conversions * dec(250, 900)).toFixed(2)),
                });
                return { impressions, clicks, spend, conversions };
            };

            for (let a = 1; a <= 2; a++) {
                const adSet = await prisma.adSet.create({
                    data: {
                        companyId, platformId: def.p.id, campaignId: campaign.id,
                        externalAdSetId: `MOCK_AS_${ci + 1}_${a}`, name: `${def.n} / AdSet ${a}`, status: pick(statuses),
                    },
                });
                for (let b = 1; b <= 2; b++) {
                    adCounter++;
                    const post = def.p.id === meta.id ? posts[adCounter % posts.length] : null;
                    const ad = await prisma.ad.create({
                        data: {
                            companyId, platformId: def.p.id, campaignId: campaign.id, adSetId: adSet.id,
                            externalAdId: `MOCK_AD_${adCounter}`, name: `${def.n} / Ad ${a}.${b}`,
                            status: pick(statuses), creativeId: `MOCK_CR_${adCounter}`, postId: post ? post.id : null,
                        },
                    });

                    for (let d = DAYS - 1; d >= 0; d--) {
                        const date = dayAgo(d);
                        const t = pushInsight("AD", ad.id, date, 1);
                        if (d < 7) {
                            for (const [type, values] of [["AGE", ages], ["GENDER", genders], ["REGION", regions],
                                ["PUBLISHER_PLATFORM", pubs], ["PLATFORM_POSITION", positions]]) {
                                const v = pick(values);
                                breakdownRows.push({
                                    companyId, platformId: def.p.id, importJobId: etlJob.id, entityLevel: "AD",
                                    entityId: ad.id, campaignId: campaign.id, date, dimensionType: type, dimensionValue: v,
                                    impressions: Math.round(t.impressions / 3), clicks: Math.round(t.clicks / 3),
                                    spend: Number((t.spend / 3).toFixed(2)), reach: Math.round(t.impressions / 4),
                                    conversions: Math.round(t.conversions / 3), conversionsValue: dec(100, 2000),
                                });
                            }
                        }
                    }

                    if (ci === 1) {
                        for (let l = 0; l < 8; l++) {
                            leadCounter++;
                            await prisma.lead.create({
                                data: {
                                    companyId, platformId: meta.id, campaignId: campaign.id, adId: ad.id,
                                    importJobId: etlJob.id, source: "FACEBOOK_LEAD_ADS",
                                    externalLeadId: `MOCK_LEAD_${leadCounter}`, formId: "MOCK_FORM_1",
                                    fullName: `ลูกค้าทดสอบ ${leadCounter}`, email: `lead${leadCounter}@example.com`,
                                    phone: `08${int(10000000, 99999999)}`, status: pick(["NEW", "CONTACTED", "QUALIFIED"]),
                                    createdAtExternal: dayAgo(int(0, DAYS - 1)),
                                },
                            });
                        }
                    }
                }
                // ad set level + campaign level rollups (distinct ids per level)
                for (let d = DAYS - 1; d >= 0; d--) pushInsight("ADSET", adSet.id, dayAgo(d), 2);
            }
            for (let d = DAYS - 1; d >= 0; d--) pushInsight("CAMPAIGN", campaign.id, dayAgo(d), 4);

            await prisma.adInsight.createMany({ data: insightRows });
            await prisma.adInsightBreakdown.createMany({ data: breakdownRows });
        }

        // --- Shopee CSV-style campaign report ----------------------------------
        const shopeeJob = await prisma.importJob.create({
            data: {
                companyId, platformId: shopee.id, filename: "mock-shopee.csv", reportName: "Mock Shopee Ads",
                reportStartDate: dayAgo(DAYS - 1), reportEndDate: dayAgo(0), totalRecords: 4,
                status: "COMPLETED", source: "CSV", importedAt: new Date(),
            },
        });
        for (let i = 1; i <= 4; i++) {
            const campaign = await prisma.campaign.create({
                data: {
                    companyId, platformId: shopee.id, externalCampaignId: `MOCK_SHP_${i}`,
                    campaignName: `Shopee - สินค้า ${i}`, campaignStatus: pick(["ongoing", "paused", "ended"]),
                    adType: pick(["product_search", "shop_ads"]), productId: `PRD${1000 + i}`,
                    bidStrategy: "auto", placement: "search", startDate: dayAgo(DAYS),
                },
            });
            const impressions = int(20000, 120000);
            const clicks = Math.round(impressions * dec(0.01, 0.05, 4));
            const orders = Math.round(clicks * dec(0.03, 0.1, 4));
            const spend = dec(800, 6000);
            const revenue = dec(2000, 25000);
            await prisma.campaignReportMetric.create({
                data: {
                    campaignId: campaign.id, importJobId: shopeeJob.id,
                    reportStartDate: dayAgo(DAYS - 1), reportEndDate: dayAgo(0),
                    impressions, clicks, ctr: Number(((clicks / impressions) * 100).toFixed(4)),
                    orders, directOrders: Math.round(orders * 0.7), unitsSold: orders + int(0, 10),
                    spend, revenue, roas: Number((revenue / spend).toFixed(2)),
                    acos: Number(((spend / revenue) * 100).toFixed(2)),
                    costPerOrder: Number((spend / Math.max(orders, 1)).toFixed(2)),
                },
            });
        }

        // --- Facebook Content (organic) ----------------------------------------
        const fbContent = await prisma.contentPlatform.upsert({
            where: { code: "FACEBOOK" }, update: {}, create: { code: "FACEBOOK", name: "Facebook" },
        });
        const contentJob = await prisma.contentImportJob.create({
            data: {
                companyId, platformId: fbContent.id, filename: "mock-content.csv",
                rangeStartDate: dayAgo(DAYS - 1), rangeEndDate: dayAgo(0), totalRecords: 24,
                status: "COMPLETED", importedAt: new Date(),
            },
        });
        const types = ["Photo", "Video", "Reel", "Link", "Status"];
        for (let i = 1; i <= 24; i++) {
            const post = await prisma.contentPost.create({
                data: {
                    companyId, platformId: fbContent.id, externalPostId: `MOCK_PAGE_${i}`,
                    pageExternalId: "MOCK_PAGE", pageName: "Mock Demo Page",
                    title: `คอนเทนต์ทดสอบ #${i}`, postType: pick(types),
                    permalink: `https://facebook.com/mock/posts/${i}`,
                    publishedAt: new Date(dayAgo(int(0, DAYS - 1)).getTime() + int(8, 21) * 3600000),
                    durationSeconds: i % 3 === 0 ? int(10, 120) : null, lastImportJobId: contentJob.id,
                },
            });
            const reach = int(500, 30000);
            await prisma.contentPostMetric.create({
                data: {
                    postId: post.id, reach, impressions: Math.round(reach * dec(1.1, 1.8)),
                    reactions: int(5, 900), comments: int(0, 150), shares: int(0, 90), saves: int(0, 60),
                    newFollowers: int(0, 30), viewers: Math.round(reach * 0.6), views: Math.round(reach * 1.2),
                    avgSecondsViewed: dec(1, 25, 3),
                },
            });
        }

        const counts = {
            campaigns: await prisma.campaign.count({ where: { companyId } }),
            ads: await prisma.ad.count({ where: { companyId } }),
            adInsights: await prisma.adInsight.count({ where: { companyId } }),
            breakdowns: await prisma.adInsightBreakdown.count({ where: { companyId } }),
            leads: await prisma.lead.count({ where: { companyId } }),
            contentPosts: await prisma.contentPost.count({ where: { companyId } }),
        };
        console.log(`Mock company "${company.name}" (id ${company.id}) ready:`, counts);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
