import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { budget, goal, area } = await req.json();

  const prompt = `คุณเป็น Facebook Ads specialist สำหรับธุรกิจรับเหมาก่อสร้างในประเทศไทย

บริษัท: นิลภัทร คอร์ปอเรชั่น จำกัด
งบโฆษณา: ${Number(budget).toLocaleString()} บาท/เดือน
เป้าหมาย: ${goal}
พื้นที่: ${area || "ไม่ระบุ (ทั่วประเทศ)"}

วางแผนโฆษณาที่ละเอียดและนำไปใช้ได้จริง โดยครอบคลุม:

1. แบ่งงบประมาณ — FB vs TikTok (เปอร์เซ็นต์และจำนวนเงิน)
2. Campaign Structure — กี่ Campaign, แต่ละ Campaign ทำอะไร
3. Objective — เลือก objective ไหนและทำไม
4. Targeting — อายุ, ความสนใจ, พฤติกรรม, พื้นที่
5. Ad Format — ประเภทโฆษณาที่แนะนำ
6. ตารางยิงโฆษณา — ช่วงเวลาและวันที่ดีที่สุด
7. KPI เป้าหมาย — CPL ที่ควรได้, จำนวน leads ที่คาดหวัง

เขียนเป็นภาษาไทย ชัดเจน นำไปใช้ได้ทันที`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });
    const plan = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI ไม่สามารถวางแผนได้" }, { status: 500 });
  }
}
