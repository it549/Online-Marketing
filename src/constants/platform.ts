import { Platform } from "@/types/platform";

export const PLATFORMS: {
    id: Platform;
    name: string;
    icon: string;
}[] = [
    {
        id: "facebook",
        name: "Facebook",
        icon: "/icons/facebook.svg",
    },
    {
        id: "tiktok",
        name: "TikTok",
        icon: "/icons/tiktok.svg",
    },
];
