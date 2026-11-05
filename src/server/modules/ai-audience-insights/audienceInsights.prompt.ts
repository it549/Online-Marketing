import type { AudienceBreakdownResponse, LeadsSummary, SpendTrendResponse } from "@/types/insights";

const DIMENSION_LABEL_TH: Record<string, string> = {
    AGE: "อายุ",
    GENDER: "เพศ",
    REGION: "ภูมิภาค",
    PUBLISHER_PLATFORM: "แพลตฟอร์ม",
    PLATFORM_POSITION: "ตำแหน่งโฆษณา",
};

interface BuildPromptInput {
    companyName: string;
    platformLabel: string;
    dateFromLabel: string;
    dateToLabel: string;
    breakdowns: AudienceBreakdownResponse[];
    trend: SpendTrendResponse;
    leadsSummary: LeadsSummary;
}

export function buildAudienceInsightsPrompt(input: BuildPromptInput): string {
    const sections: string[] = [];

    const totalSpend = input.trend.points.reduce((sum, p) => sum + p.spend, 0);
    const totalImpressions = input.trend.points.reduce((sum, p) => sum + p.impressions, 0);
    const totalClicks = input.trend.points.reduce((sum, p) => sum + p.clicks, 0);
    const totalConversions = input.trend.points.reduce((sum, p) => sum + p.conversions, 0);
    const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
    const overallCpa = totalConversions > 0 ? totalSpend / totalConversions : null;

    sections.push(
        `ภาพรวมผลลัพธ์โฆษณา (${input.platformLabel}, ${input.dateFromLabel} - ${input.dateToLabel}):\n` +
            `- ยอดใช้จ่ายรวม: ฿${totalSpend.toLocaleString()}\n` +
            `- Impressions รวม: ${totalImpressions.toLocaleString()}\n` +
            `- Clicks รวม: ${totalClicks.toLocaleString()}\n` +
            `- CTR เฉลี่ย: ${overallCtr !== null ? overallCtr.toFixed(2) + "%" : "ไม่มีข้อมูล"}\n` +
            `- Conversions รวม: ${totalConversions.toLocaleString()}\n` +
            `- CPA เฉลี่ย: ${overallCpa !== null ? "฿" + overallCpa.toFixed(2) : "ไม่มีข้อมูล"}`,
    );

    for (const breakdown of input.breakdowns) {
        if (!breakdown.hasDataInRange) continue;

        const totalSpendForDimension = breakdown.rows.reduce((sum, r) => sum + r.spend, 0);
        const byCtr = breakdown.rows.filter((r) => r.ctr !== null).sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0));
        const byCpa = breakdown.rows.filter((r) => r.cpa !== null).sort((a, b) => (a.cpa ?? Infinity) - (b.cpa ?? Infinity));

        const topCtrLines = byCtr
            .slice(0, 3)
            .map((r) => `  - ${r.dimensionValue}: CTR ${r.ctr?.toFixed(2)}% (สัดส่วนงบ ${totalSpendForDimension > 0 ? ((r.spend / totalSpendForDimension) * 100).toFixed(1) : "0"}%)`)
            .join("\n");

        const bottomCtrLines = byCtr
            .slice(-3)
            .reverse()
            .map((r) => `  - ${r.dimensionValue}: CTR ${r.ctr?.toFixed(2)}%`)
            .join("\n");

        const topCpaLines = byCpa
            .slice(0, 3)
            .map((r) => `  - ${r.dimensionValue}: CPA ฿${r.cpa?.toFixed(2)} (สัดส่วนงบ ${totalSpendForDimension > 0 ? ((r.spend / totalSpendForDimension) * 100).toFixed(1) : "0"}%)`)
            .join("\n");

        sections.push(
            `กลุ่มเป้าหมายแยกตาม${DIMENSION_LABEL_TH[breakdown.dimension] ?? breakdown.dimension}:\n` +
                `- CTR ดีที่สุด:\n${topCtrLines || "  ไม่มีข้อมูล"}\n` +
                `- CTR แย่ที่สุด:\n${bottomCtrLines || "  ไม่มีข้อมูล"}\n` +
                `- CPA ดีที่สุด (ต้นทุนต่อ conversion ต่ำสุด):\n${topCpaLines || "  ไม่มีข้อมูล"}`,
        );
    }

    if (input.leadsSummary.total > 0) {
        const byStatus = input.leadsSummary.byStatus.map((s) => `${s.status}: ${s.count}`).join(", ");
        const bySource = input.leadsSummary.bySource.map((s) => `${s.source}: ${s.count}`).join(", ");

        sections.push(`ข้อมูล Lead ในช่วงเวลานี้:\n- จำนวน Lead รวม: ${input.leadsSummary.total}\n- แยกตามสถานะ: ${byStatus}\n- แยกตามแหล่งที่มา: ${bySource}`);
    } else {
        sections.push("ข้อมูล Lead ในช่วงเวลานี้: ไม่มีข้อมูล");
    }

    return `คุณเป็นที่ปรึกษาการตลาดดิจิทัลให้กับบริษัท "${input.companyName}" ให้วิเคราะห์ข้อมูลผลลัพธ์โฆษณาต่อไปนี้ แล้วแนะนำว่าควรปรับกลุ่มเป้าหมาย/งบประมาณอย่างไรเพื่อให้แคมเปญถัดไปตอบโจทย์ลูกค้าของบริษัทมากที่สุด ตอบเป็นภาษาไทย กระชับ แบ่งเป็นข้อ ๆ

${sections.join("\n\n")}

กรุณาให้คำแนะนำในประเด็นต่อไปนี้ (ข้ามประเด็นที่ไม่มีข้อมูลรองรับ):
1. กลุ่มเป้าหมายใดควรเพิ่มงบ และกลุ่มใดควรลดงบ พร้อมเหตุผล
2. ควรปรับตำแหน่งโฆษณา/แพลตฟอร์มอย่างไร
3. คุณภาพของ Lead ที่ได้เป็นอย่างไร ควรปรับกลุ่มเป้าหมายเพื่อให้ได้ Lead คุณภาพดีขึ้นหรือไม่
4. สรุปข้อเสนอแนะแคมเปญถัดไปที่เหมาะกับลูกค้าของบริษัทนี้มากที่สุด`;
}
