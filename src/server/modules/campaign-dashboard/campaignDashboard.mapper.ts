import { DashboardData } from "@/types/dashboard";
import { Platform } from "@/types/platform";
import { CampaignDashboardResponse } from "@/types/campaignDashboard";

interface MapCampaignDashboardOptions {
    platform: Platform;
    title: string;
}

export function mapCampaignDashboard(raw: CampaignDashboardResponse, options: MapCampaignDashboardOptions): DashboardData {
    if (!raw.hasData) {
        return {
            platform: options.platform,
            title: options.title,
            hasData: false,
            metrics: [],
            table: {
                columns: [],
                rows: [],
            },
        };
    }

    return {
        platform: options.platform,
        title: options.title,
        subtitle: buildSubtitle(raw),
        hasData: true,
        metrics: [
            {
                id: "spend",
                label: "ยอดใช้จ่าย",
                value: `฿${raw.summary.spend.toLocaleString()}`,
                subtitle: "สะสมทุกช่วงเวลาที่นำเข้า",
                color: "text-blue-400",
            },

            {
                id: "revenue",
                label: "ยอดขาย",
                value: `฿${raw.summary.revenue.toLocaleString()}`,
                subtitle: "จากโฆษณา",
                color: "text-green-400",
            },

            {
                id: "profit",
                label: raw.summary.profit >= 0 ? "กำไร" : "ขาดทุน",
                value: `฿${Math.abs(raw.summary.profit).toLocaleString()}`,
                subtitle: "ยอดขาย − ค่าโฆษณา",
                color: raw.summary.profit >= 0 ? "text-emerald-400" : "text-red-400",
            },

            {
                id: "roas",
                label: "ROAS",
                value: raw.summary.roas !== null ? raw.summary.roas.toFixed(2) : "-",
                subtitle: "ยอดขาย / ค่าโฆษณา",
                color: "text-purple-400",
            },

            {
                id: "orders",
                label: "คำสั่งซื้อ",
                value: raw.summary.orders.toLocaleString(),
                subtitle: "สะสมทุกช่วงเวลาที่นำเข้า",
                color: "text-yellow-400",
            },

            {
                id: "ctr",
                label: "CTR",
                value: raw.summary.ctr !== null ? `${raw.summary.ctr.toFixed(2)}%` : "-",
                subtitle: "Click Through Rate",
                color: "text-cyan-400",
            },
        ],

        table: {
            columns: [
                { key: "name", label: "สินค้า / แคมเปญ" },
                { key: "period", label: "ช่วงเวลาที่นำเข้า" },
                { key: "spend", label: "ค่าโฆษณา", align: "right" },
                { key: "revenue", label: "ยอดขาย", align: "right" },
                { key: "profit", label: "กำไร/ขาดทุน", align: "right" },
                { key: "roas", label: "ROAS", align: "right" },
                { key: "orders", label: "คำสั่งซื้อ", align: "right" },
                { key: "status", label: "สถานะ", align: "center" },
            ],

            // One row per imported record (every file/period), not collapsed
            // per campaign -- see campaignDashboard.service.ts.
            rows: raw.records.map((record) => ({
                id: record.id,
                name: record.campaignName,
                period: formatPeriod(record.periodStart, record.periodEnd),
                spend: `฿${record.spend.toLocaleString()}`,
                revenue: `฿${record.revenue.toLocaleString()}`,
                profit: `${record.profit >= 0 ? "+" : "-"}฿${Math.abs(record.profit).toLocaleString()}`,
                roas: record.roas !== null ? record.roas.toFixed(2) : "-",
                orders: record.orders,
                status: record.status,
            })),
        },
    };
}

function formatPeriod(periodStart: string, periodEnd: string): string {
    const start = new Date(periodStart).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    const end = new Date(periodEnd).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

    return `${start} - ${end}`;
}

function buildSubtitle(raw: CampaignDashboardResponse): string | undefined {
    if (!raw.reportStartDate || !raw.reportEndDate) {
        return undefined;
    }

    const start = new Date(raw.reportStartDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    const end = new Date(raw.reportEndDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

    return `ข้อมูลสะสมจาก ${raw.importCount} ครั้งที่นำเข้า (${start} - ${end})`;
}
