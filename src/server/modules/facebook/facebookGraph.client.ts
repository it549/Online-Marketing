/**
 * Minimal transport layer for the Facebook Graph API.
 *
 * Repositories own endpoint-specific queries; this client owns only HTTP,
 * pagination, and Graph error parsing. Keeping that boundary here makes API
 * failures easier to isolate without mixing them into ETL business logic.
 */
interface GraphListResponse<T> {
    data: T[];
    paging?: { next?: string };
    error?: { message?: string };
}

interface GraphErrorResponse {
    error?: { message?: string; code?: number };
}

function graphErrorMessage(errorText: string): string {
    try {
        const parsed = JSON.parse(errorText) as GraphErrorResponse;
        const message = parsed.error?.message ?? errorText;

        if (parsed.error?.code === 10 && /pages_read_engagement|pages_read_user_content|Page Public Content Access/i.test(message)) {
            return `${message} (ต้องใช้ Facebook Page token ที่มี permission pages_read_engagement และ pages_read_user_content ทั้งคู่ และถูกสร้างขึ้นสำหรับเพจที่ระบุ ไม่ใช่ token ของ ad-account ทั่วไป)`;
        }

        return message;
    } catch {
        return errorText;
    }
}

async function ensureSuccessful(response: Response): Promise<void> {
    if (!response.ok) throw new Error(graphErrorMessage(await response.text()));
}

export async function fetchFacebookGraphList<T>(url: URL): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | undefined = url.toString();

    while (nextUrl) {
        const response = await fetch(nextUrl, { cache: "no-store" });
        await ensureSuccessful(response);

        const body = (await response.json()) as GraphListResponse<T>;
        if (body.error) throw new Error(body.error.message ?? "Facebook Graph API error");

        results.push(...body.data);
        nextUrl = body.paging?.next;
    }

    return results;
}

export async function fetchFacebookGraphItem<T>(url: URL): Promise<T> {
    const response = await fetch(url.toString(), { cache: "no-store" });
    await ensureSuccessful(response);

    const body = (await response.json()) as T & GraphErrorResponse;
    if (body.error) throw new Error(body.error.message ?? "Facebook Graph API error");

    return body;
}
