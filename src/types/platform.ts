export type Platform = "facebook" | "tiktok";

export interface PlatformConfig {
    id: Platform;
    name: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
}
