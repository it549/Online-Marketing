import { ShopeeDashboardResponse } from "@/types/shopeeDashboard";
import { ShopeeCampaignProfit } from "./shopeeTopCampaigns";

export function buildShopeeInsightsPrompt(dashboard: ShopeeDashboardResponse, campaignRanking: ShopeeCampaignProfit[]): string {
    const sections: string[] = [];

    if (dashboard.hasData) {
        const summary = dashboard.summary;

        sections.push(
            `ข้อมูลจากไฟล์ที่นำเข้า (Imported Analytics, สะสมทุกช่วงเวลาที่นำเข้า):\n` +
                `- ยอดใช้จ่ายรวม: ฿${summary.spend.toLocaleString()}\n` +
                `- ยอดขายรวม: ฿${summary.revenue.toLocaleString()}\n` +
                `- กำไร/ขาดทุนรวม: ฿${summary.profit.toLocaleString()}\n` +
                `- ROAS: ${summary.roas !== null ? summary.roas.toFixed(2) : "-"}\n` +
                `- จำนวนคำสั่งซื้อ: ${summary.orders.toLocaleString()}`,
        );

        const topProfitable = campaignRanking.slice(0, 5);
        const losing = campaignRanking.filter((c) => c.profit < 0).slice(-5).reverse();

        if (topProfitable.length > 0) {
            sections.push(
                `แคมเปญที่ทำกำไรดีที่สุด:\n${topProfitable
                    .map((c, i) => `${i + 1}. ${c.campaignName} — กำไร ฿${c.profit.toLocaleString()} (ยอดขาย ฿${c.revenue.toLocaleString()}, ค่าโฆษณา ฿${c.spend.toLocaleString()})`)
                    .join("\n")}`,
            );
        }

        if (losing.length > 0) {
            sections.push(
                `แคมเปญที่ขาดทุน:\n${losing
                    .map((c, i) => `${i + 1}. ${c.campaignName} — ขาดทุน ฿${Math.abs(c.profit).toLocaleString()} (ยอดขาย ฿${c.revenue.toLocaleString()}, ค่าโฆษณา ฿${c.spend.toLocaleString()})`)
                    .join("\n")}`,
            );
        }
    } else {
        sections.push("ข้อมูลจากไฟล์ที่นำเข้า: ยังไม่มีข้อมูล (ยังไม่มีการนำเข้าไฟล์)");
    }

    sections.push("หมายเหตุ: ยังไม่มีข้อมูลจาก Shopee API โดยตรง (รอการเชื่อมต่อ Shopee Open API) การวิเคราะห์นี้อ้างอิงจากไฟล์ที่นำเข้าเท่านั้น");

    return `คุณเป็นที่ปรึกษาธุรกิจอีคอมเมิร์ซ (Shopee) ให้วิเคราะห์ข้อมูลต่อไปนี้และให้คำแนะนำเชิงธุรกิจที่นำไปใช้ได้จริง ตอบเป็นภาษาไทย กระชับ แบ่งเป็นข้อ ๆ

${sections.join("\n\n")}

กรุณาวิเคราะห์และให้คำแนะนำในประเด็นต่อไปนี้ (ข้ามประเด็นที่ไม่มีข้อมูลรองรับ):
1. แคมเปญใดทำกำไรดีที่สุด และควรเพิ่มงบ
2. แคมเปญใดขาดทุน และควรปรับลดหรือหยุด
3. แนวโน้มยอดขายและกำไรจากข้อมูลนี้
4. ข้อเสนอแนะอื่น ๆ ในการปรับปรุงแคมเปญและการขาย`;
}
