export type Platform = "facebook" | "tiktok" | "shopee";

export interface PlatformConfig {
    id: Platform;
    name: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
}
