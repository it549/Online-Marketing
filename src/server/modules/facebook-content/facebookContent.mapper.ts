import { DashboardData } from "@/types/dashboard";
import { FacebookContentDashboardSummary } from "./facebookContent.types";

export function mapFacebookContentDashboard(summary: FacebookContentDashboardSummary): DashboardData {
    if (!summary.hasData) {
        return {
            platform: "facebook_content",
            title: "Facebook Content",
            hasData: false,
            metrics: [],
            table: {
                columns: [],
                rows: [],
            },
        };
    }

    return {
        platform: "facebook_content",
        title: "Facebook Content",
        subtitle: `${summary.totalPosts.toLocaleString()} โพสต์`,
        hasData: true,
        metrics: [
            {
                id: "reach",
                label: "Reach รวม",
                value: summary.totalReach.toLocaleString(),
                subtitle: "การเข้าถึงทั้งหมด",
                color: "text-blue-400",
            },

            {
                id: "views",
                label: "ยอดดูรวม",
                value: summary.totalViews.toLocaleString(),
                subtitle: "Views",
                color: "text-cyan-400",
            },

            {
                id: "engagement",
                label: "Engagement รวม",
                value: summary.totalEngagement.toLocaleString(),
                subtitle: "ไลก์ + คอมเมนต์ + แชร์",
                color: "text-green-400",
            },

            {
                id: "posts",
                label: "จำนวนโพสต์",
                value: summary.totalPosts.toLocaleString(),
                subtitle: "ทั้งหมด",
                color: "text-purple-400",
            },
        ],

        table: {
            columns: [
                { key: "name", label: "โพสต์" },
                { key: "postType", label: "ประเภท", align: "center" },
                { key: "reach", label: "Reach", align: "right" },
                { key: "views", label: "ยอดดู", align: "right" },
                { key: "engagement", label: "Engagement", align: "right" },
            ],

            rows: summary.posts.map((post) => ({
                id: post.id,
                name: truncateTitle(post.title),
                postType: post.postType,
                reach: post.reach.toLocaleString(),
                views: post.views.toLocaleString(),
                engagement: post.engagement.toLocaleString(),
            })),
        },

        secondaryTable: {
            title: "แยกตามประเภทโพสต์",
            table: {
                columns: [
                    { key: "name", label: "ประเภทโพสต์" },
                    { key: "postCount", label: "จำนวนโพสต์", align: "right" },
                    { key: "totalReach", label: "Reach รวม", align: "right" },
                    { key: "totalEngagement", label: "Engagement รวม", align: "right" },
                ],

                rows: summary.breakdown.map((item) => ({
                    id: item.postType,
                    name: item.postType,
                    postCount: item.postCount.toLocaleString(),
                    totalReach: item.totalReach.toLocaleString(),
                    totalEngagement: item.totalEngagement.toLocaleString(),
                })),
            },
        },
    };
}

function truncateTitle(title: string): string {
    const singleLine = title.replace(/\s+/g, " ").trim();
    return singleLine.length > 60 ? `${singleLine.slice(0, 60)}…` : singleLine;
}
