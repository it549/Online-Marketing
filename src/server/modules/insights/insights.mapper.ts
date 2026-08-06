import type { Prisma } from "@prisma/client";
import { toNumber } from "@/utils/decimal";
import type {
    AudienceBreakdownResponse,
    AudienceBreakdownRow,
    BreakdownDimension,
    LeadRowDto,
    LeadsResponse,
    LeadsSummary,
    SpendTrendPoint,
    SpendTrendResponse,
} from "@/types/insights";

interface RawBreakdownRow {
    dimensionValue: string;
    impressions: number | null;
    clicks: number | null;
    spend: Prisma.Decimal | number | null;
    conversions: Prisma.Decimal | number | null;
    conversionsValue: Prisma.Decimal | number | null;
}

export function mapAudienceBreakdown(
    dimension: BreakdownDimension,
    hasSyncedBefore: boolean,
    lastSyncedAt: Date | null,
    rows: RawBreakdownRow[],
): AudienceBreakdownResponse {
    const byValue = new Map<string, AudienceBreakdownRow>();

    for (const row of rows) {
        const existing = byValue.get(row.dimensionValue) ?? {
            dimensionValue: row.dimensionValue,
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            conversionsValue: 0,
            ctr: null,
            cpa: null,
        };

        existing.impressions += row.impressions ?? 0;
        existing.clicks += row.clicks ?? 0;
        existing.spend += toNumber(row.spend);
        existing.conversions += toNumber(row.conversions);
        existing.conversionsValue += toNumber(row.conversionsValue);

        byValue.set(row.dimensionValue, existing);
    }

    const aggregated = Array.from(byValue.values()).map((row) => ({
        ...row,
        ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : null,
        cpa: row.conversions > 0 ? row.spend / row.conversions : null,
    }));

    aggregated.sort((a, b) => b.spend - a.spend);

    return {
        hasSyncedBefore,
        hasDataInRange: aggregated.length > 0,
        dimension,
        rows: aggregated,
        lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
    };
}

interface RawTrendRow {
    date: Date;
    impressions: number | null;
    clicks: number | null;
    spend: Prisma.Decimal | number | null;
    conversions: Prisma.Decimal | number | null;
    conversionsValue: Prisma.Decimal | number | null;
}

export function mapSpendTrend(hasSyncedBefore: boolean, lastSyncedAt: Date | null, rows: RawTrendRow[]): SpendTrendResponse {
    const byDate = new Map<string, SpendTrendPoint>();

    for (const row of rows) {
        const dateKey = row.date.toISOString().slice(0, 10);
        const existing = byDate.get(dateKey) ?? {
            date: dateKey,
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            conversionsValue: 0,
        };

        existing.impressions += row.impressions ?? 0;
        existing.clicks += row.clicks ?? 0;
        existing.spend += toNumber(row.spend);
        existing.conversions += toNumber(row.conversions);
        existing.conversionsValue += toNumber(row.conversionsValue);

        byDate.set(dateKey, existing);
    }

    const points = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
        hasSyncedBefore,
        hasDataInRange: points.length > 0,
        points,
        lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
    };
}

interface RawLead {
    id: bigint;
    source: string;
    externalLeadId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
    createdAtExternal: Date | null;
}

export function mapLeads(hasSyncedBefore: boolean, lastSyncedAt: Date | null, leads: RawLead[]): LeadsResponse {
    const leadDtos: LeadRowDto[] = leads.map((lead) => ({
        id: lead.id.toString(),
        source: lead.source,
        externalLeadId: lead.externalLeadId,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        createdAtExternal: lead.createdAtExternal ? lead.createdAtExternal.toISOString() : null,
    }));

    const summary = buildLeadsSummary(leads);

    return {
        hasSyncedBefore,
        hasDataInRange: leadDtos.length > 0,
        summary,
        leads: leadDtos,
        lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
    };
}

// Deliberately a minimal shape (not RawLead) -- this is also called from the
// AI recommendation module, which must never see PII (fullName/email/phone/raw).
// Keeping this signature narrow means that path can only ever pass fields
// selected at the query layer, not just fields it "shouldn't" read.
export function buildLeadsSummary(leads: { source: string; status: string | null }[]): LeadsSummary {
    const byStatus = new Map<string, number>();
    const bySource = new Map<string, number>();

    for (const lead of leads) {
        const statusKey = lead.status ?? "UNKNOWN";
        byStatus.set(statusKey, (byStatus.get(statusKey) ?? 0) + 1);
        bySource.set(lead.source, (bySource.get(lead.source) ?? 0) + 1);
    }

    return {
        total: leads.length,
        byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
        bySource: Array.from(bySource.entries()).map(([source, count]) => ({ source, count })),
    };
}
