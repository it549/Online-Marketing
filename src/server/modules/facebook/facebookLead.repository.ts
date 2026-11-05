import { config } from "@/server/configurations/config";
import type { FacebookCredentials } from "./facebookAuth";
import { fetchFacebookGraphList } from "./facebookGraph.client";

export interface FacebookLeadFormRow {
    id: string;
    name: string;
}

export interface FacebookFieldDataEntry {
    name: string;
    values: string[];
}

export interface FacebookLeadRow {
    id: string;
    created_time: string;
    ad_id?: string;
    campaign_id?: string;
    form_id?: string;
    field_data?: FacebookFieldDataEntry[];
}

export async function getFacebookLeadForms(credentials: FacebookCredentials): Promise<FacebookLeadFormRow[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${credentials.adAccountId}/leadgen_forms`);
    url.searchParams.set("fields", "id,name");
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphList<FacebookLeadFormRow>(url);
}

/** `sinceUnixSeconds` filters to leads created after that instant (GREATER_THAN, exclusive). */
export async function getFacebookFormLeads(
    credentials: FacebookCredentials,
    formId: string,
    sinceUnixSeconds: number,
): Promise<FacebookLeadRow[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${formId}/leads`);
    url.searchParams.set("fields", "id,created_time,ad_id,campaign_id,form_id,field_data");
    url.searchParams.set("filtering", JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: sinceUnixSeconds }]));
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphList<FacebookLeadRow>(url);
}
