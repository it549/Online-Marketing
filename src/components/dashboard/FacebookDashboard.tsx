"use client";

import { useState } from "react";
import { Megaphone, Newspaper, Sparkles } from "lucide-react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSection from "./PlatformSection";
import FacebookOverviewTabs, { FacebookTabKey } from "./facebook/FacebookOverviewTabs";
import FacebookApiPerformance from "./facebook/FacebookApiPerformance";
import FacebookImportedAnalytics from "./facebook/FacebookImportedAnalytics";
import FacebookAiInsights from "./facebook/FacebookAiInsights";

const SECTION_CONFIG: Record<
    FacebookTabKey,
    { accent: "blue" | "emerald" | "indigo"; icon: typeof Megaphone; title: string; subtitle: string }
> = {
    ads: {
        accent: "blue",
        icon: Megaphone,
        title: "ผลลัพธ์โฆษณา",
        subtitle: "เงินที่ลงทุนไปกับผลที่ได้กลับมา — Spend, Leads, CPL",
    },
    organic: {
        accent: "emerald",
        icon: Newspaper,
        title: "ผลลัพธ์ออร์แกนิก (เพจ)",
        subtitle: "คนเห็น คนกดใจ และเข้าถึงเพจจากคอนเทนต์ที่โพสต์ — Reach, Reactions, Engagement",
    },
    ai: {
        accent: "indigo",
        icon: Sparkles,
        title: "สรุปด้วย AI",
        subtitle: "วิเคราะห์ภาพรวมโฆษณา + ออร์แกนิกร่วมกัน หาสิ่งที่ควรทำต่อ",
    },
};

export default function FacebookDashboard() {
    const [activeTab, setActiveTab] = useState<FacebookTabKey>("ads");
    const section = SECTION_CONFIG[activeTab];

    return (
        <div className="space-y-6">
            <PlatformPageHeader
                name="Facebook"
                icon="/icons/facebook.svg"
                description="ผลลัพธ์โฆษณาและผลลัพธ์คอนเทนต์บนเพจ ในหน้าเดียว"
            />

            {/* การ์ดสรุป = ตัวสลับ tab ในตัวเอง ไม่มีการ์ดสรุปแยกกับ tab bar แยกอีกต่อไป */}
            <FacebookOverviewTabs activeTab={activeTab} onChange={setActiveTab} />

            {/* โชว์รายละเอียดเต็มของแค่ tab ที่เลือกอยู่ ไม่ stack ทุก section พร้อมกัน */}
            <PlatformSection accent={section.accent} icon={section.icon} title={section.title} subtitle={section.subtitle}>
                {activeTab === "ads" && <FacebookApiPerformance />}
                {activeTab === "organic" && <FacebookImportedAnalytics />}
                {activeTab === "ai" && <FacebookAiInsights />}
            </PlatformSection>
        </div>
    );
}
