import { ImportPlatformOption } from "@/types/import";

export const IMPORT_PLATFORMS: ImportPlatformOption[] = [
    {
        code: "SHOPEE",
        name: "Shopee",
        enabled: true,
    },
    {
        code: "META",
        name: "Facebook / Meta Ads",
        enabled: false,
    },
    {
        code: "TIKTOK",
        name: "TikTok Ads",
        enabled: false,
    },
    {
        code: "GOOGLE_ADS",
        name: "Google Ads",
        enabled: false,
    },
];
