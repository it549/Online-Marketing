---
name: facebook-meta-etl-debugging
description: Playbook for debugging Facebook/Meta Graph API integrations and this project's Facebook ETL sync (facebookEtl.service.ts, facebookEtl.repository.ts, etlOrchestrator.service.ts, ad_posts/campaigns/ads tables). Use this whenever the user reports a Facebook/Meta sync failure, a Graph API error (#100, #10, #190, #200), missing data in ad_posts/campaigns/ad_insights tables despite no visible error, token/permission errors (pages_read_engagement, read_insights), or asks about Facebook Insights metrics, breakdowns, or Page vs Ad Account tokens. Also trigger for any "sync ไม่ทำงาน", "ไม่มี error แต่ไม่มีข้อมูล", "token expired/unauthorized" issue involving Facebook/Meta. Push hard to consult this before re-deriving Graph API facts from scratch or re-running the same debugging steps already documented here.
---

# Facebook/Meta Graph API + ETL Debugging Playbook

รวบรวมจากการ debug จริงในโปรเจกต์นี้ — ใช้ตรวจสอบตามลำดับก่อนเดาสาเหตุใหม่ เพราะปัญหาส่วนใหญ่ที่เจอซ้ำๆ อยู่ใน checklist นี้แล้ว

## หลักการสำคัญที่สุด: "ไม่ error แต่ไม่มีข้อมูล" = silent skip ไม่ใช่ silent failure

Pattern ที่เจอซ้ำที่สุดในโปรเจกต์นี้คือโค้ดมี `if (!x) continue` หรือ `.filter(...)` ที่ตัดข้อมูลทิ้งแบบเงียบๆ โดยไม่ throw/log เลย ไล่เช็คตามลำดับนี้ก่อนเสมอเวลาเจออาการ "sync รันได้ ไม่ error แต่ table ว่าง":

1. **String/enum key mismatch ระหว่างชั้นต่างๆ** — โปรเจกต์นี้มี "META" (ตาราง `platforms.code`, ใช้เป็น FK) กับ "facebook" (`CompanyPlatformId`, ควบคุมว่า cron จะ sync company ไหน) เป็น **2 ระบบคนละความหมายที่ชื่อคล้ายกัน** เคยเกิด mismatch มาแล้วทั้งคู่:
   - Query `platform: { code: "FACEBOOK" }` แต่ DB เก็บ `"META"` → 404 เงียบ
   - `AD_INSIGHT_SYNCERS`/`LEAD_SYNCERS` object ใช้ key `META:` แต่ `CompanyPlatformId` type คือ `"facebook" | "shopee" | "tiktok" | "googleAds"` (ตัวเล็ก, ไม่มี META เป็น member) → `syncers[platform]` ได้ `undefined` → `if (!syncer) continue` ข้ามไปเงียบๆ ทั้ง sync ไม่เคยถูกเรียกเลย
   - **เช็คเสมอ:** เทียบ key/string literal ที่ใช้ query กับค่าจริงใน DB แบบ exact match ก่อนสงสัยอย่างอื่น `grep` หาทุกจุดที่ hardcode string platform code แล้วเทียบให้ตรงกันหมด
   - **แก้ระยะยาว:** รวมเป็น constant ตัวเดียว (`PLATFORM_CODE.META`) แทน hardcode string กระจายหลายไฟล์ เพื่อให้ TypeScript จับ typo ได้ทันทีที่ compile

2. **Early return ก่อนถึงจุดที่ทำงานจริง** — เช็ค `resolveFacebookCredentials`, `isFacebookTokenExpired` ก่อนเสมอว่า sync function return `{ status: "skipped", reason: ... }` ไปตั้งแต่ต้นหรือเปล่า ก่อนจะไปสงสัยโค้ดส่วนลึกกว่านั้น — log ที่วางไว้ท้ายฟังก์ชันจะไม่มีทาง log เลยถ้า early return ไปก่อน

3. **Cron/route ไม่เคยถูกเรียกเลย** — เช็คว่ามี trigger จริง (ปุ่ม UI / cron schedule) อยู่ไหม อย่าสมมติว่า "เขียนฟังก์ชัน sync ไว้แล้ว = มันถูกเรียก" ไล่ตาม chain: cron config (`vercel.json`) → route handler → orchestrator → syncer function ทีละชั้น อย่าข้ามขั้นตอนไหนเลย

4. **`.filter()`/`.catch()` ที่กลืน error เงียบ** — จุดแบบ `try { ... } catch (error) { console.warn(...); return null; }` ใน loop ที่ตามด้วย `.filter(x => x !== null)` จะทำให้ล้มบางส่วนโดยไม่กระทบ exit code — เช็ค server-side terminal log (ไม่ใช่ browser console) เสมอ เพราะ `console.log`/`console.warn` ฝั่ง server ไม่โผล่ใน browser DevTools

## ลำดับการ debug มาตรฐาน เมื่อ sync ไม่มีข้อมูลเข้า DB

ไล่เช็คตามลำดับนี้ **ก่อน** จะไปสงสัย business logic ซับซ้อน:

1. Endpoint/cron เคยถูกเรียกจริงไหม (เช็ค log, ปุ่ม UI มีอยู่จริงไหม, cron deploy บน production แล้วหรือยัง — Vercel Cron ทำงานเฉพาะ production deployment)
2. Auth guard ผ่านไหม (`requireCronSecret`, `CRON_SECRET` env ตรงกันทั้ง config และ `.env.local` — ระวัง quote รอบค่าใน env ที่ทำให้ค่าไม่ตรงกัน, ต้อง restart dev server หลังแก้ env เพราะ Next.js ไม่ hot-reload env vars)
3. Credentials/token resolve ได้ไหม (`resolveFacebookCredentials`, token expired check)
4. Platform/company enable check ผ่านไหม (`parseCompanyPlatforms`, `AD_INSIGHT_SYNCERS` key mismatch ตามข้อ 1 ด้านบน)
5. Graph API call จริงสำเร็จไหม (เพิ่ม log ดู response ดิบ, เช็คว่า field ที่ขอ เช่น `creative{id}` ได้ค่ากลับมาจริงไหม)
6. Normalize/adapter แปลง field ตรงกับ schema ไหม (`normalizeFacebookPost` → `NormalizedPost` → `ad_posts` columns)
7. `saveEtlSyncResult` upsert สำเร็จไหม (เช็ค error, เช็คว่า `dryRun: true` ไม่ได้ค้างอยู่ในโค้ด — ถ้า dryRun เป็น true จะไม่เขียน DB เลยแต่ return เหมือนสำเร็จ)
8. Query ฝั่ง read (`getCampaignDetailByExternalCampaignId` ฯลฯ) ใช้ key เดียวกับตอน insert ไหม (ปัญหา FACEBOOK vs META เคยเกิดตรงนี้)

รันคำสั่งนี้เพื่อตามรอย call chain เวลาไม่แน่ใจว่าฟังก์ชันถูกเรียกจากไหน:
```bash
grep -rn "<functionName>" src/ --include="*.ts"
```
หรือ VS Code `Ctrl+Shift+F` search ทั้งโปรเจกต์ เร็วกว่าถ้าทำงานในนั้นอยู่แล้ว

## Facebook Graph API — ข้อเท็จจริงที่ตรวจสอบแล้วจากเอกสารทางการ (ใช้แทนการเดาจาก memory)

### Token scope: Ad Account (Marketing API) ≠ Page (Page Insights API)

| ต้องการอะไร | Endpoint | Token ที่ต้องใช้ |
|---|---|---|
| ads, campaigns, insights (level=ad/adset/campaign) | `/act_{ad_account_id}/...` | User/System User token ที่มีสิทธิ์บน ad account (ไม่ต้องเป็น Page token) |
| Page posts, post insights | `/{page_id}/posts`, `/{post_id}/insights` | **Page-scoped token เท่านั้น** ห้ามใช้ User token ตรงๆ |

Page token ได้จาก `GET /me/accounts?fields=id,name,access_token` (ใช้ User token ที่มี `pages_show_list` + `pages_read_engagement` ยิง) — Page token ที่ได้จะสืบทอดอายุจาก User token ต้นทาง (long-lived user token → page token ไม่หมดอายุเลย)

**เช็ค token ก่อนใช้เสมอด้วย `/debug_token`:**
```
GET /debug_token?input_token={token}&access_token={app_id}|{app_secret}
```
ดู `type` (`PAGE` vs `USER`), `scopes`, และ **`granular_scopes[].target_ids`** — ข้อผิดพลาดที่เจอบ่อย: scope name โผล่ใน `scopes` list (เช่น `pages_read_engagement`) แต่ **ไม่มี `target_ids` ผูกกับเพจที่ต้องการ** ทำให้ Facebook ปฏิเสธ resolve เป็น Page token จริง (error #10) แม้ scope ดูเหมือนมีครบ

**สาเหตุที่ `target_ids` หายบ่อย:** ตอน generate token ผ่าน Graph API Explorer หรือ OAuth dialog ไม่ได้ผ่านหน้า **"Choose the Pages you want [App] to access"** (และ "Choose the Businesses...") — ถ้า flow ข้ามหน้านี้ไป scope จะถูก grant มาแบบไม่ผูก resource เฉพาะเจาะจง ต้อง re-authorize ใหม่แล้วเลือก "Opt in to current Pages/Businesses only" ให้ครบทุกหน้าที่เด้งมา

**ถ้ายัง error #10 หลัง token มี `target_ids` ถูกต้องแล้ว:** เช็ค App Mode (Development vs Live) ที่ App Dashboard → Settings → Basic:
- Development mode: user ที่ authorize ต้องอยู่ใน App roles (Admin/Developer/Tester) ไม่ใช่แค่เป็น Admin ของ Page
- Live mode: permission ต้องมี **Advanced Access** ผ่าน App Review ไม่ใช่แค่ Standard Access — เช็คที่ App Review → Permissions and Features

### Metric names เปลี่ยนบ่อย — อย่าเชื่อจาก memory, เช็คสดจากเอกสารเสมอ

Metric หลายตัวถูก deprecate อย่างต่อเนื่อง (รอบล่าสุด 15 มิ.ย. 2025, 15 พ.ย. 2025, 15 มิ.ย. 2026) ตัวอย่างที่ยืนยันแล้วว่าตายแล้ว ณ ส.ค. 2026:
- `post_impressions` → ใช้ `post_media_view` แทน
- `post_impressions_unique` → ใช้ `post_total_media_view_unique` แทน
- `post_clicks_by_type`, `post_reactions_by_type_total` (ใน insights endpoint) → ยกเลิกตั้งแต่ v13.0 (2021)
- **ไม่มี metric ชื่อ `post_engaged_users`** ในเอกสารทางการปัจจุบันเลย (เคยเข้าใจผิดว่ามี เพราะไปอ้างอิงจาก third-party code sample ที่ไม่ใช่เอกสารทางการ)

**กฎสำคัญ:** error `(#100) The value must be a valid insights metric` หมายความว่า **มี metric ตัวเดียวไม่ valid ก็ทำให้ทั้ง request fail หมด** ไม่ใช่แค่ตัวที่ผิด — ต้องแยกทดสอบทีละ metric เพื่อหาตัวที่เป็นปัญหา แทนที่จะเดาทั้งชุด

**Metric ที่ยืนยันแล้วว่า valid (v26.0, post-level, `period=lifetime`):**
```
post_media_view, post_total_media_view_unique, post_clicks,
post_reactions_like_total / love_total / wow_total / haha_total / sorry_total / anger_total,
post_reactions_by_type_total, post_video_views (ถ้าเป็นวิดีโอ)
```

**ก่อนใช้ metric ไหนก็ตาม ให้ web_fetch เอกสารสดจาก `https://developers.facebook.com/docs/graph-api/reference/insights/` เช็คก่อนเสมอ** อย่าอ้างอิงจาก session ก่อนหน้าหรือ memory เพราะ list เปลี่ยนได้ทุกไม่กี่เดือน

### `platform_position` breakdown ต้องคู่กับ `publisher_platform` เสมอ

Error `(#100) Current combination of data breakdown columns (action_type, platform_position) is invalid` เกิดเพราะ Facebook ไม่ให้ขอ `platform_position` breakdown เดี่ยวๆ เมื่อ request มี action-decomposed field (`actions`/`action_values`) ร่วมด้วย ต้องยิงรวมกับ `publisher_platform` ในคำขอเดียว (`breakdowns=publisher_platform,platform_position`) แล้วแยก normalize เป็น 2 ชุดจาก response เดียวกันทีหลัง — ส่วน AGE/GENDER/REGION ยังขอเดี่ยวได้ปกติ

### Post-level insights ต้องใส่ `period=lifetime` เสมอ

ถ้า query ผ่าน (ไม่ error) แต่ `data: []` ว่างเปล่า เช็คตามลำดับนี้:
1. ใส่ `period=lifetime` หรือยัง (post-level insights เป็น lifetime metric ไม่ใช่ daily)
2. เพจมีไลค์ครบ 100+ ไหม (`GET /{page_id}?fields=fan_count`) — ต่ำกว่านี้ Facebook ไม่คืนข้อมูล insights เลย
3. โพสต์เก่าพอหรือยัง (ข้อมูลมี lag 24-48 ชม., metric ที่เพิ่ง deprecate/เปลี่ยนชื่อไม่มี backfill ย้อนหลังให้โพสต์เก่าก่อนวันเปลี่ยน)
4. เพจอยู่ใน "New Page Experience" หรือยัง (endpoint นี้รองรับเฉพาะ New Page Experience)
5. Token มี ANALYZE task บนเพจจริงไหม ไม่ใช่แค่มี permission scope

### object เดี่ยว vs list ต้อง parse ต่างกัน

`GET /{creative_id}` และ `GET /{post_id}` return object ตรงๆ (`{ id, ... }`) **ไม่มี** `{ data: [...] }` wrapper แบบ list endpoint — ถ้าเผลอเอา pagination helper (ที่ทำ `results.push(...body.data)`) ไปใช้กับ endpoint แบบนี้จะได้ `TypeError: spread of undefined` ทันที ต้องมีฟังก์ชันแยกสำหรับ single-object fetch (`fetchFacebookGraphItem` ในโปรเจกต์นี้) กับ list fetch (`fetchFacebookGraphList`) เป็นคนละตัว

### Batch API สำหรับลด N+1 calls

เวลาต้องดึง creative/post หลายตัวพร้อมกัน (เช่น resolve post ของทุก ad ใน account) ใช้ Facebook Batch API (`POST /` พร้อม `batch` param เป็น JSON array ของ `{method, relative_url}`) แทนการ loop ยิงทีละตัว — สูงสุด 50 sub-request ต่อ batch call หนึ่งครั้ง sub-request ที่ fail (object ถูกลบ/ไม่มีสิทธิ์) ให้ข้ามเป็น `null` ไม่ throw ทั้ง batch

## Checklist ก่อนสรุปว่า "แก้เสร็จแล้ว"

- [ ] `npx tsc --noEmit` ผ่านสนิท (ไม่ใช่แค่ dev server รันได้ — Next.js dev mode บางครั้งไม่ strict เท่า `tsc`)
- [ ] Restart dev server เต็มรูปแบบหลังแก้ env var ใดๆ (ไม่ hot-reload)
- [ ] เช็ค server terminal log ไม่ใช่ browser console เวลา debug backend/API route
- [ ] Trigger endpoint จริงด้วย curl/fetch ตรงๆ ก่อนเชื่อว่า UI จะทำงาน (ตัดตัวแปร frontend ออกก่อน)
- [ ] เช็คค่าจริงใน DB ด้วย SQL ตรงๆ แทนการเดาจากพฤติกรรม UI เพียงอย่างเดียว