"use client";

import AiInsightsPanel from "../AiInsightsPanel";

export default function ShopeeAiInsights() {
    return (
        <AiInsightsPanel
            endpoint="/api/dashboard/shopee/ai-insights"
            description="AI จะวิเคราะห์จากข้อมูลไฟล์ที่นำเข้า (ต้นทุน กำไร ขาดทุน และแคมเปญ) เท่านั้น เนื่องจากยังไม่มีการเชื่อมต่อ Shopee API โดยตรง"
        />
    );
}
