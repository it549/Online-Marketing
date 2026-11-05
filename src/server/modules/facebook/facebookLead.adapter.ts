import type { NormalizedLead } from "@/server/core/etl/etl.types";
import type { FacebookFieldDataEntry, FacebookLeadRow } from "./facebookLead.repository";

const PLATFORM_CODE = "META" as const;

// Field names vary per form (e.g. "full_name" vs "name", "email" vs "work_email"),
// so this is a best-effort key match -- the full field_data array is always kept
// in `raw` so nothing is lost if the match misses.
const NAME_KEYS = ["full_name", "name", "first_name"];
const EMAIL_KEYS = ["email", "work_email"];
const PHONE_KEYS = ["phone_number", "phone"];

function firstValueByKeys(fieldData: FacebookFieldDataEntry[], keys: string[]): string | undefined {
    for (const key of keys) {
        const match = fieldData.find((field) => field.name === key);
        if (match?.values?.[0]) return match.values[0];
    }
    return undefined;
}

export function normalizeFacebookLead(row: FacebookLeadRow): NormalizedLead {
    const fieldData = row.field_data ?? [];

    return {
        platformCode: PLATFORM_CODE,
        source: "FACEBOOK_LEAD_ADS",
        externalLeadId: row.id,
        externalCampaignId: row.campaign_id,
        externalAdId: row.ad_id,
        formId: row.form_id,
        fullName: firstValueByKeys(fieldData, NAME_KEYS),
        email: firstValueByKeys(fieldData, EMAIL_KEYS),
        phone: firstValueByKeys(fieldData, PHONE_KEYS),
        createdAtExternal: row.created_time ? new Date(row.created_time) : undefined,
        raw: { field_data: fieldData },
    };
}
