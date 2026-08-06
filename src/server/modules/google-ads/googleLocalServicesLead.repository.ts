import type { Company } from "@prisma/client";

// Local Services Ads leads are a distinct Google product/OAuth scope from the
// Google Ads API already integrated in this codebase -- no credential shape is
// known until product access is granted, so no speculative Company columns are
// added here. This always returns false until that access exists.
export function isLocalServicesLeadsConfigured(_company: Company): boolean {
    void _company;
    return false;
}
