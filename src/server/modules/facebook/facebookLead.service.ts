import type { Company } from "@prisma/client";
import { saveEtlLeads } from "@/server/core/etl/etl-database.service";
import type { NormalizedLeadSyncResult, PlatformLeadSyncResult } from "@/server/core/etl/etl.types";
import { isFacebookTokenExpired, resolveFacebookCredentials } from "./facebookAuth";
import { getFacebookFormLeads, getFacebookLeadForms } from "./facebookLead.repository";
import { normalizeFacebookLead } from "./facebookLead.adapter";

export async function syncFacebookLeadsForCompany(
    company: Company,
    sinceDate: Date,
    options: { dryRun?: boolean } = {},
): Promise<PlatformLeadSyncResult> {
    const credentials = resolveFacebookCredentials(company);
    if (!credentials) return { status: "skipped", reason: "not_connected" };
    if (isFacebookTokenExpired(company)) return { status: "skipped", reason: "token_expired" };

    const sinceUnixSeconds = Math.floor(sinceDate.getTime() / 1000);

    let leadRows;
    try {
        const forms = await getFacebookLeadForms(credentials);
        const leadsByForm = await Promise.all(forms.map((form) => getFacebookFormLeads(credentials, form.id, sinceUnixSeconds)));
        leadRows = leadsByForm.flat();
    } catch (error) {
        return { status: "failed", reason: error instanceof Error ? error.message : String(error) };
    }

    const result: NormalizedLeadSyncResult = {
        platformCode: "META",
        leads: leadRows.map(normalizeFacebookLead),
    };

    const { created, updated } = await saveEtlLeads(company.id, result, options);
    return { status: "synced", counts: { leads: created + updated } };
}
