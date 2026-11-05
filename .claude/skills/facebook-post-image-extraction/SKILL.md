---
name: facebook-post-image-extraction
description: Add or fix image/thumbnail URL storage for Facebook Page posts synced into content_posts. Use this whenever the user asks to store, display, or fix missing post images/thumbnails from Facebook, mentions the Graph API "attachments" field, asks why content_posts has no image column, or wants a post calendar/gallery/card view to show a thumbnail. Covers the Graph API attachments{media,subattachments} response shape, the schema migration needed, the extraction/normalize function, and the CDN URL expiry caveat. Trigger before re-deriving the attachments parsing logic from scratch.
---

# Facebook Post Image Extraction

Pattern สำหรับดึง URL รูปภาพ/thumbnail จากโพสต์ Facebook (`/{page_id}/posts`) แล้วเก็บลงตาราง `content_posts` ของโปรเจกต์นี้ — ใช้เวลามีคน sync โพสต์แล้วพบว่าไม่มีรูปเก็บไว้เลย หรือจะสร้าง view ที่ต้องโชว์ thumbnail (calendar, gallery, card list)

## เมื่อไหร่ควรใช้ skill นี้

- content_posts ไม่มี column เก็บรูป แล้วต้องการเพิ่ม
- โพสต์ sync มาแล้วแต่ field รูปว่างเปล่า/หายไป
- ทำ UI ที่ต้องโชว์ thumbnail ของโพสต์ (calendar card, gallery)

**ไม่ใช่ scope ของ skill นี้:** debug sync ทั้งระบบไม่ทำงาน (ดู `facebook-meta-etl-debugging`), หรือสร้าง calendar UI เต็มรูปแบบ (ดู `content-calendar-view`) — skill นี้เจาะจงแค่ "รูปหาย/ต้องดึงรูปจาก attachments" เท่านั้น

## ขั้นตอนที่ 1: ขอ field `attachments` ให้ลึกพอ

Field เปล่าๆ แบบนี้มักได้ object ว่างหรือไม่มี URL รูปจริง:
```
❌ fields=id,message,created_time,permalink_url,attachments
```

ต้องระบุ sub-field ให้ครบ:
```
✅ fields=id,message,created_time,permalink_url,attachments{type,media,subattachments}
```

## ขั้นตอนที่ 2: เข้าใจโครงสร้าง response — มี 2 รูปแบบ

**โพสต์รูปเดียว/วิดีโอ (มี thumbnail):**
```json
{
  "attachments": {
    "data": [
      { "type": "photo", "media": { "image": { "src": "https://scontent.xx.fbcdn.net/...", "width": 720, "height": 720 } } }
    ]
  }
}
```

**โพสต์แบบ album/carousel (หลายรูป) — รูปซ้อนอยู่ใน `subattachments`:**
```json
{
  "attachments": {
    "data": [
      {
        "type": "album",
        "subattachments": {
          "data": [
            { "media": { "image": { "src": "https://...รูปที่1" } } },
            { "media": { "image": { "src": "https://...รูปที่2" } } }
          ]
        }
      }
    ]
  }
}
```

**กับดักที่พลาดบ่อย:** เขียน parser ที่อ่านแค่ `attachments.data[0].media.image.src` เฉยๆ จะได้ `undefined` เงียบๆ สำหรับโพสต์แบบ album ทุกโพสต์ เพราะรูปจริงอยู่ใน `subattachments` ไม่ใช่ `media` ชั้นนอก ต้องเช็คทั้ง 2 ระดับเสมอ

## ขั้นตอนที่ 3: Schema migration

เลือกตามความต้องการ:

```sql
-- ถ้าต้องการแค่ thumbnail เดียว (พอสำหรับ calendar/list view ส่วนใหญ่)
ALTER TABLE `content_posts` ADD COLUMN `image_url` TEXT NULL;

-- ถ้าต้องการเก็บทุกรูปของ album (สำหรับ gallery แบบดูครบทุกรูป)
ALTER TABLE `content_posts` ADD COLUMN `image_urls` JSON NULL;
```

**ค่าเริ่มต้นที่แนะนำ:** เริ่มจาก `image_url` (รูปแรกพอ) ก่อนเสมอ เว้นแต่ผู้ใช้ระบุชัดว่าต้องการ gallery ครบทุกรูป — ประหยัดความซับซ้อนทั้งฝั่ง query และ frontend

## ขั้นตอนที่ 4: ฟังก์ชัน extract (ใช้ได้ทั้ง single และ array)

```ts
interface FacebookAttachment {
    type?: string;
    media?: { image?: { src?: string; width?: number; height?: number } };
    subattachments?: { data?: FacebookAttachment[] };
}

interface FacebookPostAttachments {
    data?: FacebookAttachment[];
}

/** ดึง URL รูปทั้งหมด -- รองรับทั้งโพสต์รูปเดียวและ album/carousel */
function extractImageUrls(attachments?: FacebookPostAttachments): string[] {
    if (!attachments?.data) return [];

    const urls: string[] = [];
    for (const item of attachments.data) {
        if (item.media?.image?.src) urls.push(item.media.image.src);
        if (item.subattachments?.data) {
            for (const sub of item.subattachments.data) {
                if (sub.media?.image?.src) urls.push(sub.media.image.src);
            }
        }
    }
    return urls;
}
```

**ใช้ตอน normalize (ตัวอย่างสำหรับ single `image_url`):**

```ts
export function normalizeFacebookPagePost(row: FacebookPostRow, pageId: string): NormalizedContentPost {
    const imageUrls = extractImageUrls(row.attachments);

    return {
        // ...field เดิม (id, message, permalink, published_at ฯลฯ)
        imageUrl: imageUrls[0] ?? null,
    };
}
```

ถ้าเก็บเป็น `image_urls` JSON array แทน ให้ใช้ `toPrismaJson(imageUrls)` (pattern เดียวกับที่ `etl-database.service.ts` ใช้ตอนเก็บ `raw` field ของ insights)

## ขั้นตอนที่ 5: ⚠️ ใส่ `imageUrl` ใน `update` block ของ upsert ด้วย ไม่ใช่แค่ `create`

**นี่คือจุดที่พลาดบ่อยที่สุดตอน "เพิ่ม field ใหม่แล้ว re-sync"** — post ที่เคย sync ไปแล้วก่อนหน้ามี row อยู่แล้วใน `content_posts` เพราะฉะนั้น `upsert` จะเข้า branch `update` ไม่ใช่ `create` ถ้า `update` object ไม่มี `imageUrl` อยู่ในนั้น **จะ sync กี่รอบก็ไม่มีวันได้รูปสำหรับ post เก่าเลย** แม้ extraction function จะทำงานถูกต้อง 100% ก็ตาม (อาการจะดูเหมือน "sync สำเร็จ ไม่ error แต่รูปยังว่างอยู่ดี" ซึ่งเข้าเคสเดียวกับปัญหา silent-skip ที่เจอบ่อยในโปรเจกต์นี้)

```ts
await tx.contentPost.upsert({
    where: { /* unique key เดิม เช่น companyId_platformId_externalPostId */ },
    update: {
        // ...field เดิม
        imageUrl: post.imageUrl ?? null,   // ⭐ ต้องมีบรรทัดนี้ใน update ด้วย ไม่ใช่แค่ create
    },
    create: {
        // ...field เดิม
        imageUrl: post.imageUrl ?? null,
    },
});
```

**เช็คก่อนถือว่า field ใหม่ทำงานสมบูรณ์:** grep หาทุกจุดที่ `upsert` ตารางเดียวกัน แล้วเทียบว่า field ใหม่ที่เพิ่งเพิ่มอยู่ครบทั้ง 2 block (`update` และ `create`) ไม่ใช่แค่ block เดียว — pattern นี้ใช้ตรวจสอบได้กับทุก field ใหม่ที่เพิ่มเข้าตารางที่มี upsert อยู่แล้ว ไม่ใช่แค่ `imageUrl`

## ⚠️ ข้อควรระวังสำคัญ: URL รูปจาก Facebook หมดอายุได้

`media.image.src` เป็น **CDN link ที่มี token/signature ผูกเวลาไว้** ไม่ใช่ permanent URL — ปกติใช้ได้ไม่กี่ชั่วโมงถึงไม่กี่วัน เก็บลง DB แล้วมาโหลดทีหลังนานๆ อาจ 404/broken image

**ทางเลือกตามความเข้มงวดที่ต้องการ:**

| ระดับ | วิธี | เหมาะกับ |
|---|---|---|
| เร็วสุด แต่มีความเสี่ยง | เก็บ URL ตรงๆ ใน DB | Dashboard ที่ sync ข้อมูลบ่อย (รายวัน) รูปเก่าเผื่อ broken ได้ |
| เสถียรกว่า | ดาวน์โหลดรูปมาเก็บใน storage ตัวเอง (S3/Cloud Storage/local) แล้วเก็บ URL ของ storage นั้นแทน | ต้องการความเสถียรระยะยาว, ไม่อยาก re-sync บ่อย |

ถ้าผู้ใช้ไม่ระบุ ให้เริ่มจาก **เก็บ URL ตรงๆ ก่อน** (เร็ว ใช้งานได้จริงในทางปฏิบัติถ้า sync สม่ำเสมอ) แล้วเตือนเรื่อง expiry ไว้เป็น known trade-off — ไม่ต้อง build download-to-storage pipeline ทันทีเว้นแต่ถูกขอ

## Checklist ก่อนส่งงาน

- [ ] Field request มี `attachments{type,media,subattachments}` ครบ ไม่ใช่แค่ `attachments` เฉยๆ (field ชื่อ `type` ไม่ใช่ `media_type`)
- [ ] Parser เช็คทั้ง `media.image.src` ชั้นนอก และ `subattachments.data[].media.image.src` ชั้นใน (album)
- [ ] Migration เพิ่ม column แล้วรัน `npx prisma generate`
- [ ] `imageUrl` อยู่ครบทั้ง `update` และ `create` block ของ upsert (ไม่ใช่แค่ `create`) — ไม่งั้น post เก่าไม่มีวันได้รูปแม้ re-sync กี่รอบ
- [ ] บอกผู้ใช้เรื่อง URL หมดอายุ ไม่ใช่ปล่อยให้เจอเองทีหลังตอนรูป broken