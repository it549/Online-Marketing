import { Megaphone, Newspaper, Sparkles } from "lucide-react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSection from "./PlatformSection";
import FacebookAdsOverview from "./facebook/FacebookAdsOverview";
import FacebookImportedAnalytics from "./facebook/FacebookImportedAnalytics";
import FacebookAiInsights from "./facebook/FacebookAiInsights";

export default function FacebookDashboard() {
    return (
        <div className="space-y-6">
            <PlatformPageHeader
                name="Facebook"
                icon="/icons/facebook.svg"
                description="ผลลัพธ์โฆษณาและผลลัพธ์คอนเทนต์บนเพจ ในหน้าเดียว"
            />

            <PlatformSection
                accent="blue"
                icon={Megaphone}
                title="ผลลัพธ์โฆษณา"
                subtitle="เงินที่ลงทุนไปกับผลที่ได้กลับมา — Spend, Funnel, Trend, กลุ่มเป้าหมาย และแคมเปญ"
            >
                <FacebookAdsOverview />
            </PlatformSection>

            <PlatformSection
                accent="emerald"
                icon={Newspaper}
                title="ผลลัพธ์ออร์แกนิก (เพจ)"
                subtitle="คนเห็น คนกดใจ และเข้าถึงเพจจากคอนเทนต์ที่โพสต์ — Reach, Reactions, Engagement"
            >
                <FacebookImportedAnalytics />
            </PlatformSection>

            <PlatformSection
                accent="indigo"
                icon={Sparkles}
                title="สรุปด้วย AI"
                subtitle="วิเคราะห์ภาพรวมโฆษณา + ออร์แกนิกร่วมกัน หาสิ่งที่ควรทำต่อ"
            >
                <FacebookAiInsights />
            </PlatformSection>
        </div>
    );
}
