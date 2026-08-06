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
    error?: { message?: string };
}

function graphErrorMessage(errorText: string): string {
    try {
        return (JSON.parse(errorText) as GraphErrorResponse).error?.message ?? errorText;
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
