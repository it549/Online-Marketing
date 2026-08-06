import { parse } from "csv-parse/sync";

import { FacebookContentParsedReport, FacebookContentRawRow } from "./facebookContent.types";

// Column order observed in Meta Business Suite's "Content" export (22 columns,
// 0-indexed). Columns 8 and 9 (a blank custom-label column, and a "date"
// column that only ever contains the word "Lifetime") carry no per-row data.
// Columns 11, 12 and 19 could not be identified with certainty from the
// sample file (it arrived double mis-encoded with some bytes unrecoverably
// dropped) and are intentionally left unmapped below -- revisit once a
// cleanly UTF-8-encoded export is available.
const COLUMN = {
    POST_ID: 0,
    PAGE_ID: 1,
    PAGE_NAME: 2,
    TITLE: 3,
    DURATION_SECONDS: 4,
    PUBLISHED_AT: 5,
    PERMALINK: 6,
    POST_TYPE: 7,
    AVG_SECONDS_VIEWED: 10,
    REACH: 13,
    REACTIONS: 14,
    COMMENTS: 15,
    SHARES: 16,
    SAVES: 17,
    NEW_FOLLOWERS: 18,
    VIEWERS: 20,
    VIEWS: 21,
} as const;

function parseNumber(value: string | undefined): number {
    if (!value) {
        return 0;
    }

    const normalized = value.trim().replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function parseNullableNumber(value: string | undefined): number | null {
    if (!value || value.trim() === "" || value.trim() === "--") {
        return null;
    }

    const normalized = value.trim().replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
}

// Publish time is US-style "MM/DD/YYYY HH:mm", unlike Shopee's "DD/MM/YYYY".
function parseUsDateTime(value: string | undefined): Date | null {
    if (!value) {
        return null;
    }

    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);

    if (!match) {
        return null;
    }

    const [, month, day, year, hour = "0", minute = "0"] = match;

    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

// The export's filename encodes the report window, e.g.
// "May-23-2026_Jul-22-2026_เนื้อหา_...csv" -- used only for the
// ContentImportJob audit record, it does not gate re-imports.
export function parseFacebookContentFilenameRange(fileName: string): { rangeStartDate: Date | null; rangeEndDate: Date | null } {
    const match = fileName.match(/^([A-Za-z]{3})-(\d{1,2})-(\d{4})_([A-Za-z]{3})-(\d{1,2})-(\d{4})_/);

    if (!match) {
        return { rangeStartDate: null, rangeEndDate: null };
    }

    const [, startMonth, startDay, startYear, endMonth, endDay, endYear] = match;
    const rangeStartDate = parseNamedMonthDate(startMonth, startDay, startYear);
    const rangeEndDate = parseNamedMonthDate(endMonth, endDay, endYear);

    return { rangeStartDate, rangeEndDate };
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseNamedMonthDate(monthName: string, day: string, year: string): Date | null {
    const monthIndex = MONTH_NAMES.indexOf(monthName.toLowerCase());

    if (monthIndex === -1) {
        return null;
    }

    return new Date(Number(year), monthIndex, Number(day));
}

export function parseFacebookContentCsv(csvContent: string, fileName: string): FacebookContentParsedReport {
    const records = parse(csvContent, {
        columns: false,
        skip_empty_lines: true,
        bom: true,
        relax_column_count: true,
        from_line: 2, // skip the header row
        trim: true,
    }) as string[][];

    const rows: FacebookContentRawRow[] = records.map((record) => ({
        postId: (record[COLUMN.POST_ID] ?? "").trim(),
        pageId: (record[COLUMN.PAGE_ID] ?? "").trim(),
        pageName: (record[COLUMN.PAGE_NAME] ?? "").trim(),
        title: (record[COLUMN.TITLE] ?? "").trim(),
        durationSeconds: parseNumber(record[COLUMN.DURATION_SECONDS]),
        publishedAt: parseUsDateTime(record[COLUMN.PUBLISHED_AT]),
        permalink: (record[COLUMN.PERMALINK] ?? "").trim(),
        postType: (record[COLUMN.POST_TYPE] ?? "").trim(),
        avgSecondsViewed: parseNullableNumber(record[COLUMN.AVG_SECONDS_VIEWED]),
        reach: parseNullableNumber(record[COLUMN.REACH]),
        reactions: parseNullableNumber(record[COLUMN.REACTIONS]),
        comments: parseNullableNumber(record[COLUMN.COMMENTS]),
        shares: parseNullableNumber(record[COLUMN.SHARES]),
        saves: parseNullableNumber(record[COLUMN.SAVES]),
        newFollowers: parseNullableNumber(record[COLUMN.NEW_FOLLOWERS]),
        viewers: parseNullableNumber(record[COLUMN.VIEWERS]),
        views: parseNullableNumber(record[COLUMN.VIEWS]),
    }));

    const { rangeStartDate, rangeEndDate } = parseFacebookContentFilenameRange(fileName);

    return { rangeStartDate, rangeEndDate, rows };
}
