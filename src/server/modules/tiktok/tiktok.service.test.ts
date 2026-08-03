import { describe, expect, it } from "vitest";
import { getTikTokDashboard } from "./tiktok.service";
import { tiktokCampaignMock } from "./campaign.mock";

// This mock dataset is not wired into the live site (TikTok's real dashboard is
// credential-gated via tiktokApiPerformance.service.ts) -- it only exists to give
// the mapping/aggregation logic something deterministic to test against.
describe("getTikTokDashboard (mock fixture)", () => {
    it("maps the mock repository into the DashboardData shape", async () => {
        const dashboard = await getTikTokDashboard();

        expect(dashboard.platform).toBe("tiktok");
        expect(dashboard.table.rows).toHaveLength(tiktokCampaignMock.campaigns.length);
    });

    it("carries the mock summary totals through to the metric cards", async () => {
        const dashboard = await getTikTokDashboard();

        const spendMetric = dashboard.metrics.find((m) => m.id === "spend");
        const leadsMetric = dashboard.metrics.find((m) => m.id === "lead");

        expect(spendMetric?.value).toBe(`฿${tiktokCampaignMock.summary.spend.toLocaleString()}`);
        expect(leadsMetric?.value).toBe(tiktokCampaignMock.summary.leads.toString());
    });

    it("maps each mock campaign row with a formatted spend and the original status", async () => {
        const dashboard = await getTikTokDashboard();
        const firstCampaign = tiktokCampaignMock.campaigns[0];
        const firstRow = dashboard.table.rows[0];

        expect(firstRow.name).toBe(firstCampaign.name);
        expect(firstRow.spend).toBe(`฿${firstCampaign.spend.toLocaleString()}`);
        expect(firstRow.status).toBe(firstCampaign.status);
    });
});
