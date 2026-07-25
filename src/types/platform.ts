export type Platform = "facebook" | "tiktok" | "shopee" | "facebook_content";

export interface PlatformConfig {
    id: Platform;
    name: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
}
