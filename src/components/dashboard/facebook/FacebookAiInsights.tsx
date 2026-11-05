"use client";

import AiInsightsPanel from "../AiInsightsPanel";

export default function FacebookAiInsights() {
    return (
        <AiInsightsPanel
            endpoint="/api/dashboard/facebook/ai-insights"
            description="AI จะวิเคราะห์จากผลลัพธ์โฆษณา (Facebook API) และคอนเทนต์ที่นำเข้า (Imported Analytics) เท่าที่มีข้อมูลจริงในขณะนั้น"
        />
    );
}
