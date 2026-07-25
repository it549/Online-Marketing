import { FacebookCampaignResponse } from "@/types/facebook";

export const facebookDashboardMock: FacebookCampaignResponse = {
    summary: {
        spend: 125000,
        leads: 320,
        cpl: 390,
        ctr: 3.85,
    },
    campaigns: [
        {
            id: "FB001",
            name: "Safety Helmet",
            spend: 15000,
            leads: 42,
            cpl: 357,
            status: "ACTIVE",
        },
        {
            id: "FB002",
            name: "Safety Shoes",
            spend: 12000,
            leads: 31,
            cpl: 387,
            status: "PAUSED",
        },
    ],
};
