import type { Company } from "@prisma/client";
import type { PlatformLeadSyncResult } from "@/server/core/etl/etl.types";
import { isLocalServicesLeadsConfigured } from "./googleLocalServicesLead.repository";

// Seam for a future real implementation: once Local Services Ads access is
// granted, this is the only file (plus the repository above) that needs to
// change -- no orchestrator or schema change required.
export async function syncGoogleLocalServicesLeadsForCompany(company: Company): Promise<PlatformLeadSyncResult> {
    if (!isLocalServicesLeadsConfigured(company)) {
        return { status: "skipped", reason: "not_configured" };
    }

    return { status: "skipped", reason: "not_implemented" };
}
