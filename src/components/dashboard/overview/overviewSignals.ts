import type { LeadsSummary } from "@/types/insights";
import type { OverviewCampaignRow, OverviewPlatformSummary } from "@/types/overview";

const HIGH_CPL_MULTIPLIER = 1.5;
const PLATFORM_GAP_THRESHOLD = 0.6;

export interface OverviewSignals {
    /** Highest-spend campaign that got zero leads -- money spent with nothing to show for it. */
    zeroLeadCampaign: OverviewCampaignRow | null;
    /** Worst-CPL campaign, only flagged when its CPL is meaningfully above the average of lead-gen campaigns. */
    highCplCampaign: OverviewCampaignRow | null;
    avgCpl: number | null;
    /** Best/worst ROAS platform, only set when both have real spend+ROAS and the gap is meaningful. */
    bestPlatform: OverviewPlatformSummary | null;
    worstPlatform: OverviewPlatformSummary | null;
    /** Ad spend happened in the selected range but zero leads came in anywhere. */
    noLeadsDespiteSpend: boolean;
    /** Lowest-CPL campaign among those that actually got leads -- the "double down here" candidate. */
    bestCampaign: OverviewCampaignRow | null;
}

/**
 * Derives every "AI-sounding" signal on the homepage from real, already-fetched numbers --
 * same technique as trendSummary.ts / AudienceThingsToDo.tsx in the Insights page: no external
 * model call, no stored score, just thresholds applied to real aggregates.
 */
export function computeOverviewSignals(
    topCampaigns: OverviewCampaignRow[],
    platforms: OverviewPlatformSummary[],
    leadsSummary: LeadsSummary | null,
    periodSpend: number,
): OverviewSignals {
    const zeroLeadCandidates = topCampaigns.filter((c) => c.spend > 0 && c.leads === 0);
    const zeroLeadCampaign = zeroLeadCandidates.length > 0 ? [...zeroLeadCandidates].sort((a, b) => b.spend - a.spend)[0] : null;

    const leadCampaigns = topCampaigns.filter((c) => c.leads > 0);
    const totalLeadSpend = leadCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalLeadCount = leadCampaigns.reduce((sum, c) => sum + c.leads, 0);
    const avgCpl = totalLeadCount > 0 ? totalLeadSpend / totalLeadCount : null;

    let highCplCampaign: OverviewCampaignRow | null = null;
    if (avgCpl !== null && leadCampaigns.length >= 2) {
        const worst = [...leadCampaigns].sort((a, b) => b.cpl - a.cpl)[0];
        if (worst.cpl > avgCpl * HIGH_CPL_MULTIPLIER) highCplCampaign = worst;
    }

    const platformsWithRoas = platforms.filter((p) => p.hasData && p.roas !== null && p.spend > 0);
    let bestPlatform: OverviewPlatformSummary | null = null;
    let worstPlatform: OverviewPlatformSummary | null = null;
    if (platformsWithRoas.length >= 2) {
        const sorted = [...platformsWithRoas].sort((a, b) => (b.roas as number) - (a.roas as number));
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if ((best.roas as number) > 0 && (worst.roas as number) < (best.roas as number) * PLATFORM_GAP_THRESHOLD) {
            bestPlatform = best;
            worstPlatform = worst;
        }
    }

    const noLeadsDespiteSpend = leadsSummary !== null && leadsSummary.total === 0 && periodSpend > 0;

    const bestCampaign = leadCampaigns.length > 0 ? [...leadCampaigns].sort((a, b) => a.cpl - b.cpl)[0] : null;

    return { zeroLeadCampaign, highCplCampaign, avgCpl, bestPlatform, worstPlatform, noLeadsDespiteSpend, bestCampaign };
}
