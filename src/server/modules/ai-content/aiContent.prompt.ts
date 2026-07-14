import { AIContentRequest } from "@/server/types/AIContent";

export function buildContentPrompt(data: AIContentRequest) {
    const sections: string[] = [];

    if (data.platform === "TikTok" || data.platform === "ทั้งคู่") {
        sections.push(`
สร้าง TikTok Script

- Hook
- เนื้อหา
- CTA
`);
    }

    if (data.platform === "Facebook" || data.platform === "ทั้งคู่") {
        sections.push(`
สร้าง Facebook Post

- Caption
- Hashtag
- CTA
`);
    }

    return `
คุณเป็น Copywriter มืออาชีพ

บริษัท:
นิลภัทร คอร์ปอเรชั่น จำกัด

ประเภทงาน
${data.service}

Platform
${data.platform}

Tone
${data.tone}

${data.extra ? `รายละเอียดเพิ่มเติม : ${data.extra}` : ""}

${sections.join("\n")}

ตอบเป็นภาษาไทย
`;
}