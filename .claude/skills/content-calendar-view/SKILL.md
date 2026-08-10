---
name: content-calendar-view
description: Build calendar-style views (Daily/Weekly/Monthly toggle, date-grouped grid) for this project's data -- content posts, campaigns, leads, or any table with a timestamp column. Use this whenever the user asks for a "calendar", "ปฏิทิน", "แสดงเป็นรายวัน/สัปดาห์/เดือน", a schedule/timeline view grouped by date, or references a calendar-style mockup/screenshot. Covers both the Prisma query pattern (group-by-day) and the React calendar grid component pattern used in this codebase. Trigger this before designing a new date-grouped view from scratch -- don't re-derive the grouping/timezone logic each time.
---

# Content Calendar View

Pattern สำหรับสร้าง view แบบปฏิทิน (Daily / Weekly / Monthly) จากข้อมูลที่มี timestamp column ในโปรเจกต์นี้ — ใช้ได้กับ `content_posts`, `campaigns`, `leads`, หรือตารางอื่นที่มีวันที่ ไม่ต้องออกแบบ query/component ใหม่ทุกครั้ง

## เมื่อไหร่ควรใช้ skill นี้

- ผู้ใช้ขอ "ปฏิทิน", "calendar", "แสดงรายวัน/สัปดาห์/เดือน", "timeline", "schedule view"
- ผู้ใช้แนบภาพ mockup ที่เป็น grid แบ่งตามวัน/สัปดาห์ (เช่น calendar app, booking app, content planner)
- ต้องการ group ข้อมูลตาม date range แล้วแสดงเป็น card ต่อวัน

**ไม่ใช่ scope ของ skill นี้:** การ debug Facebook/Meta API sync (ดู skill แยก `facebook-meta-etl-debugging`) — ถ้าปัญหาคือ "sync ไม่ทำงาน" ให้ไปใช้ skill นั้นแทน ไม่ใช่ skill นี้

## ขั้นตอนที่ 1: Backend — Group by day/week/month

หลักการเดียวกันไม่ว่าจะเป็น posts, campaigns, หรือ leads — คำนวณ date range ตาม view mode แล้ว query ครั้งเดียว group ฝั่ง application (ไม่ต้อง GROUP BY ใน SQL เพราะต้องการ full row ไม่ใช่แค่ aggregate):

```ts
// utils/dateRange.ts
export function getDateRangeForView(
    view: "daily" | "weekly" | "monthly",
    referenceDate: Date,
): { start: Date; end: Date } {
    const d = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));

    if (view === "daily") {
        const end = new Date(d);
        end.setUTCDate(end.getUTCDate() + 1);
        return { start: d, end };
    }

    if (view === "weekly") {
        const day = d.getUTCDay(); // 0=Sun
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const start = new Date(d);
        start.setUTCDate(start.getUTCDate() + diffToMonday);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 7);
        return { start, end };
    }

    // monthly
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    return { start, end };
}
```

```ts
// service ตัวอย่างสำหรับ content_posts -- pattern เดียวกันใช้กับ campaigns/leads ได้เลย
// แค่เปลี่ยน model + date column (published_at -> start_date / created_at_external ฯลฯ)
export async function getContentPostsForCalendar(
    companyId: bigint,
    view: "daily" | "weekly" | "monthly",
    referenceDate: Date,
) {
    const { start, end } = getDateRangeForView(view, referenceDate);

    const posts = await prisma.contentPost.findMany({
        where: { companyId, publishedAt: { gte: start, lt: end } },
        include: { metrics: true, platform: true },
        orderBy: { publishedAt: "asc" },
    });

    const grouped = new Map<string, typeof posts>();
    for (const post of posts) {
        if (!post.publishedAt) continue;
        const dayKey = post.publishedAt.toISOString().slice(0, 10); // YYYY-MM-DD
        if (!grouped.has(dayKey)) grouped.set(dayKey, []);
        grouped.get(dayKey)!.push(post);
    }

    return { range: { start, end }, postsByDay: Object.fromEntries(grouped) };
}
```

**Route handler:**
```ts
// GET /api/content/calendar?view=weekly&date=2026-08-08
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const companyId = await getSelectedCompanyId(request);
    const view = (request.nextUrl.searchParams.get("view") ?? "weekly") as "daily" | "weekly" | "monthly";
    const dateParam = request.nextUrl.searchParams.get("date");
    const referenceDate = dateParam ? new Date(dateParam) : new Date();

    const data = await getContentPostsForCalendar(companyId, view, referenceDate);
    return NextResponse.json(data);
}
```

### หมายเหตุเรื่อง timezone

ถ้า business logic อื่นในโปรเจกต์ใช้เวลาไทย (ดู `getYesterdayInBangkok` ใน ETL cron) ให้ตรวจสอบว่าปฏิทินนี้ควร group ตาม **UTC** หรือ **Asia/Bangkok** — ถ้าผู้ใช้ทั้งหมดอยู่ไทย แนะนำ group ตาม Bangkok time ไม่ใช่ UTC ตรงๆ (โพสต์ที่ publish 01:00 น. ไทย คือ 18:00 UTC วันก่อนหน้า จะเข้าผิดวันถ้า group ด้วย UTC เฉยๆ) ปรับ `getDateRangeForView` ให้ offset +7 ชม.ก่อนคำนวณ boundary ถ้าจำเป็น

## ขั้นตอนที่ 2: Frontend — Calendar grid component

โครงสร้างมาตรฐาน: header (view toggle + date navigation) → grid 7 คอลัมน์ (วันในสัปดาห์) → card ต่อ item ในแต่ละวัน

```tsx
type ViewMode = "daily" | "weekly" | "monthly";

interface CalendarItem {
    id: string;
    title: string;
    time: string;       // "10:00"
    colorTag: string;   // platform code หรือ category ใช้ map เป็นสี
    metricLabel?: string; // เช่น "1.2k reach"
}

function CalendarView({ postsByDay, view, onViewChange, onNavigate }: {
    postsByDay: Record<string, CalendarItem[]>;
    view: ViewMode;
    onViewChange: (v: ViewMode) => void;
    onNavigate: (direction: "prev" | "next") => void;
}) {
    const days = view === "monthly" ? getMonthDays(/* ... */) : getWeekDays(/* ... */);

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <ViewToggle value={view} onChange={onViewChange} options={["daily", "weekly", "monthly"]} />
                <DateNav onPrev={() => onNavigate("prev")} onNext={() => onNavigate("next")} />
            </div>
            <div className="calendar-grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                {days.map((day) => (
                    <div key={day.key} className="calendar-column">
                        <div className="calendar-day-label">{day.label}</div>
                        {(postsByDay[day.key] ?? []).map((item) => (
                            <div key={item.id} className={`calendar-card tag-${item.colorTag}`}>
                                <div className="calendar-card-title">{item.title}</div>
                                <div className="calendar-card-time">{item.time}</div>
                                {item.metricLabel && <div className="calendar-card-metric">{item.metricLabel}</div>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### สีตาม platform/category — map แบบนี้ ไม่ hardcode สีทีละจุด

```ts
const PLATFORM_COLOR_TAG: Record<string, string> = {
    META: "facebook",
    GOOGLE: "google",
    TIKTOK: "tiktok",
    SHOPEE: "shopee",
};
```

ผูก CSS class `.tag-facebook`, `.tag-google` ฯลฯ ไว้ใน stylesheet กลาง แทนที่จะ inline สีในตัว component — เผื่อวันหลังต้องเพิ่ม platform ใหม่ไม่ต้องไล่แก้ทุกจุด (เรียนรู้จากปัญหา hardcode platform code กระจายหลายไฟล์ที่เจอตอน debug ETL sync)

## ขั้นตอนที่ 3: เช็คก่อนส่งมอบงาน

- [ ] View toggle (Daily/Weekly/Monthly) เปลี่ยน date range ใน query ถูกต้อง ไม่ใช่แค่เปลี่ยน UI label
- [ ] Timezone ของการ group ตรงกับพฤติกรรมที่ธุรกิจคาดหวัง (เช็คตามหมายเหตุด้านบน)
- [ ] วันที่ไม่มี item เลย ต้อง render column ว่างเปล่า ไม่ใช่ error หรือ column หาย (ทำให้ grid เพี้ยน)
- [ ] Responsive ที่ mobile — 7 คอลัมน์เต็มจอ desktop ต้องยุบเหลือ scroll แนวนอนหรือสลับเป็น list บนมือถือ
- [ ] ถ้ามีการ์ดเยอะในวันเดียว ต้อง scroll ภายใน column ได้ ไม่ดัน layout ทั้งแถวยืดจนเพี้ยน

## Reference: schema ที่ใช้ได้กับ pattern นี้ในโปรเจกต์

| Table | Date column ที่ใช้ group | หมายเหตุ |
|---|---|---|
| `content_posts` | `published_at` | join `content_post_metrics` (post_id) สำหรับ reach/comments/shares |
| `campaigns` | `start_date` / `end_date` | อาจต้อง render เป็น range แทน single-day card |
| `leads` | `created_at_external` | join `campaign`/`ad` เพื่อโชว์ชื่อแคมเปญบน card |
| `ad_insights` (ถ้าต้องการ) | `date` | เป็น aggregate รายวันอยู่แล้ว ไม่ต้อง group ซ้ำ |

เมื่อสั่งงานสำหรับตารางใหม่ ให้ระบุ 3 อย่างนี้กับ Claude เสมอ: (1) ตารางไหน (2) date column ไหน (3) อยากได้ view mode ไหนบ้าง (Daily/Weekly/Monthly ทั้งหมด หรือแค่บางอัน) — จะได้ apply pattern นี้ตรงจุดโดยไม่ต้องออกแบบใหม่