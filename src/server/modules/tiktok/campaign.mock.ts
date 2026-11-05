import { TikTokCampaignResponse } from "@/types/tiktok";

export const tiktokCampaignMock: TikTokCampaignResponse = {
    summary: {
        spend: 142380,
        leads: 462,
        cpl: 308,
        ctr: 4.18,
    },

    campaigns: [
        {
            id: "TT001",
            name: "Safety Helmet Video Ads",
            spend: 23500,
            leads: 92,
            cpl: 255,
            status: "ACTIVE",
        },

        {
            id: "TT002",
            name: "Safety Shoes Review",
            spend: 18420,
            leads: 74,
            cpl: 249,
            status: "ACTIVE",
        },

        {
            id: "TT003",
            name: "Industrial Gloves Demo",
            spend: 17680,
            leads: 61,
            cpl: 290,
            status: "ACTIVE",
        },

        {
            id: "TT004",
            name: "Respirator Testing",
            spend: 15600,
            leads: 48,
            cpl: 325,
            status: "ACTIVE",
        },

        {
            id: "TT005",
            name: "PPE Factory Solution",
            spend: 20800,
            leads: 67,
            cpl: 310,
            status: "ACTIVE",
        },

        {
            id: "TT006",
            name: "Fire Safety Campaign",
            spend: 13200,
            leads: 39,
            cpl: 338,
            status: "PAUSED",
        },

        {
            id: "TT007",
            name: "Traffic Safety Equipment",
            spend: 10600,
            leads: 31,
            cpl: 342,
            status: "ACTIVE",
        },

        {
            id: "TT008",
            name: "Working at Height",
            spend: 12580,
            leads: 50,
            cpl: 252,
            status: "ACTIVE",
        },
    ],
};
