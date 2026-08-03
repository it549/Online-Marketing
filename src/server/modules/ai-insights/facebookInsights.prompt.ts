import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { FacebookContentDashboardResponse } from "@/types/facebookContentDashboard";

export function buildFacebookInsightsPrompt(
    apiPerformance: ApiPerformanceResponse | null,
    contentAnalytics: FacebookContentDashboardResponse | null,
): string {
    const sections: string[] = [];

    if (apiPerformance?.connected) {
        const metricLines = apiPerformance.metrics.map((m) => `- ${m.label}: ${m.value}`).join("\n");
        sections.push(`ข้อมูลผลลัพธ์โฆษณา (จาก Facebook API, ${apiPerformance.dateRangeLabel ?? "ล่าสุด"}):\n${metricLines}`);
    } else {
        sections.push("ข้อมูลผลลัพธ์โฆษณา (API): ยังไม่มีข้อมูล (ยังไม่ได้เชื่อมต่อ หรือเชื่อมต่อ Facebook API ไม่สำเร็จ)");
    }

    if (contentAnalytics?.hasData) {
        const topPosts = contentAnalytics.posts
            .slice(0, 5)
            .map((post, i) => `${i + 1}. [${post.postType}] "${post.title}" — Reach ${post.reach.toLocaleString()}, Engagement ${post.engagement.toLocaleString()}`)
            .join("\n");

        const breakdown = contentAnalytics.breakdown
            .map((item) => `- ${item.postType}: ${item.postCount} โพสต์, Reach รวม ${item.totalReach.toLocaleString()}, Engagement รวม ${item.totalEngagement.toLocaleString()}`)
            .join("\n");

        sections.push(
            `ข้อมูลคอนเทนต์ที่นำเข้า (Imported Analytics):\n` +
                `- จำนวนโพสต์: ${contentAnalytics.totalPosts.toLocaleString()}\n` +
                `- Reach รวม: ${contentAnalytics.totalReach.toLocaleString()}\n` +
                `- Views รวม: ${contentAnalytics.totalViews.toLocaleString()}\n` +
                `- การกดใจรวม (Reactions): ${contentAnalytics.totalReactions.toLocaleString()}\n` +
                `- Engagement รวม: ${contentAnalytics.totalEngagement.toLocaleString()}\n\n` +
                `แยกตามประเภทโพสต์:\n${breakdown}\n\n` +
                `โพสต์ที่มี Reach สูงสุด:\n${topPosts}`,
        );
    } else {
        sections.push("ข้อมูลคอนเทนต์ที่นำเข้า (Imported Analytics): ยังไม่มีข้อมูล (ยังไม่มีการนำเข้าไฟล์)");
    }

    return `คุณเป็นที่ปรึกษาการตลาด Facebook ให้วิเคราะห์ข้อมูลต่อไปนี้และให้คำแนะนำเชิงธุรกิจที่นำไปใช้ได้จริง ตอบเป็นภาษาไทย กระชับ แบ่งเป็นข้อ ๆ

${sections.join("\n\n")}

กรุณาวิเคราะห์และให้คำแนะนำในประเด็นต่อไปนี้ (ข้ามประเด็นที่ไม่มีข้อมูลรองรับ):
1. คอนเทนต์ประเภทใดมี Performance ดีที่สุด และควรทำเพิ่ม
2. ภาพรวมผลลัพธ์โฆษณาเป็นอย่างไร
3. ความสัมพันธ์ระหว่าง Content Performance และ Ad Performance (ถ้ามีข้อมูลทั้งสองฝั่ง)
4. แนวทางการสร้างคอนเทนต์ใหม่`;
}
