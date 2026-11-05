import { Platform } from "@/types/platform";

export const PLATFORMS: {
    id: Platform;
    name: string;
    icon: string;
    description: string;
}[] = [
    {
        id: "facebook",
        name: "Facebook",
        icon: "/icons/facebook.svg",
        description: "โฆษณาและคอนเทนต์บนเพจ Facebook",
    },
    {
        id: "tiktok",
        name: "TikTok",
        icon: "/icons/tiktok.svg",
        description: "แคมเปญโฆษณาบน TikTok Ads",
    },

    {
        id: "shopee",
        name: "Shopee",
        icon: "/icons/shopee.svg",
        description: "ยอดขายและโฆษณาบนร้าน Shopee",
    },
];
