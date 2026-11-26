import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { OverviewInsightResponse, OverviewResponse } from "@/types/overview";
import OverviewPage from "./OverviewPage";

// The hooks only fetch, so they are replaced with fixed results; the page itself renders for real.
const state = vi.hoisted(() => ({ insight: null as OverviewInsightResponse | null, insightLoading: false }));

const overview: OverviewResponse = {
    generatedAt: "2026-11-26T00:00:00.000Z",
    totals: { spend: 17276.76, shopeeRevenue: 160126, leads: 0, avgRoas: 9.27, avgCpl: null },
    platforms: [],
    topCampaigns: [],
};

vi.mock("@/hooks/useOverview", () => ({
    useOverview: () => ({ data: overview, loading: false, error: null, refetch: () => {} }),
}));
vi.mock("@/hooks/useOverviewInsight", () => ({
    useOverviewInsight: () => ({ data: state.insight, loading: state.insightLoading, error: null, refetch: () => {} }),
}));

const emptyInsight: OverviewInsightResponse = {
    hasSyncedBefore: false,
    hasDataInRange: false,
    points: [],
    leadsSummary: { total: 0, byStatus: [], bySource: [] },
    lastSyncedAt: null,
};

const syncedInsight: OverviewInsightResponse = {
    ...emptyInsight,
    hasSyncedBefore: true,
    hasDataInRange: true,
    points: [{ date: "2026-11-25", impressions: 100, clicks: 10, spend: 50, conversions: 1, conversionsValue: 200 }],
};

function render(insight: OverviewInsightResponse | null, insightLoading = false) {
    state.insight = insight;
    state.insightLoading = insightLoading;
    return renderToStaticMarkup(<OverviewPage />);
}

const LIVE_SPEND = "฿17,276.76";

describe("OverviewPage", () => {
    it("shows live figures without a click when there is no synced data", () => {
        expect(render(emptyInsight)).toContain(LIVE_SPEND);
    });

    it("shows live figures when the synced-data request failed", () => {
        expect(render(null)).toContain(LIVE_SPEND);
    });

    it("keeps the detail section collapsed when synced data exists", () => {
        expect(render(syncedInsight)).not.toContain(LIVE_SPEND);
    });

    it("stays collapsed while synced data is still loading for the first time", () => {
        expect(render(null, true)).not.toContain(LIVE_SPEND);
    });

    it("points to the sync button where it actually is", () => {
        const html = render(emptyInsight);

        expect(html).toContain("แท็บ Audience");
        expect(html).not.toContain("หน้าอินไซต์");
    });
});
