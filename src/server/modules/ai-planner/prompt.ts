export function generateMarketingPlanPrompt(budget: number, goal: string, area?: string,) {
    return `คุณเป็น Facebook Ads specialist สำหรับธุรกิจรับเหมาก่อสร้างในประเทศไทย
        บริษัท: นิลภัทร คอร์ปอเรชั่น จำกัด
        งบโฆษณา: ${budget.toLocaleString()} บาท/เดือน
        เป้าหมาย: ${goal}
        พื้นที่: ${area || "ไม่ระบุ (ทั่วประเทศ)"}

        วางแผนโฆษณาที่ละเอียดและนำไปใช้ได้จริง โดยครอบคลุม

        1. แบ่งงบประมาณ — FB vs TikTok
        2. Campaign Structure
        3. Objective
        4. Targeting
        5. Ad Format
        6. ตารางยิงโฆษณา
        7. KPI เป้าหมาย

    ตอบเป็นภาษาไทย`;
}