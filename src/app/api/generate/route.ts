import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    const { service, platform, tone, extra } = await req.json();

    const prompt = `คุณเป็น copywriter มืออาชีพสำหรับธุรกิจรับเหมาก่อสร้างและอสังหาริมทรัพย์ในประเทศไทย

  บริษัท: นิลภัทร คอร์ปอเรชั่น จำกัด — รับเหมาก่อสร้าง ออกแบบ ระบบไฟฟ้า ระบบดับเพลิง
  ประเภทงาน: ${service}
  Platform: ${platform}
  Tone: ${tone}

  // ตรงนี้สามารถแยกเงื่อนไขการเช็คได้ array.push เอา
  ${extra ? `รายละเอียดเพิ่มเติม: ${extra}` : ""}

  // เนื้อหาใน platform จะเห็นว่าถ้ามี platform เพิ่มขึ้นจะต้องเขียนโค้ดเพิ่ม
  ${
      platform === "TikTok" || platform === "ทั้งคู่"
          ? `สร้าง TikTok Script:
  - Hook (3 วินาทีแรก): ประโยคที่ดึงความสนใจ
  - เนื้อหา: อธิบายงาน/บริการ 30-45 วินาที
  - CTA: call to action ชัดเจน`
          : ""
  }

  ${
      platform === "Facebook" || platform === "ทั้งคู่"
          ? `สร้าง Facebook Post:
  - Caption: 3-5 ประโยค
  - Hashtag: 5-8 อัน ที่เกี่ยวข้อง
  - CTA: ให้ลูกค้าทักมา`
          : ""
  }

  เขียนภาษาไทยที่เป็นธรรมชาติ น่าเชื่อถือ และกระตุ้นให้ติดต่อ`;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        });
        const content = completion.choices[0]?.message?.content || "";
        return NextResponse.json({ content });
    } catch (e) {
        const message = e instanceof Error ? e.message : "AI ไม่สามารถสร้าง content ได้";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
