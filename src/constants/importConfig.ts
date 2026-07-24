import { Platform } from "@/types/platform";
import { ImportPlatformOption } from "@/types/import";
import { IMPORT_PLATFORMS } from "@/constants/importPlatform";

export interface ImportConfig {
    endpoint: string;
    platforms: ImportPlatformOption[];
}

const AD_CAMPAIGN_IMPORT_CONFIG: ImportConfig = {
    endpoint: "/api/import",
    platforms: IMPORT_PLATFORMS,
};

export const IMPORT_CONFIG_BY_PLATFORM: Record<Platform, ImportConfig> = {
    facebook: AD_CAMPAIGN_IMPORT_CONFIG,
    tiktok: AD_CAMPAIGN_IMPORT_CONFIG,
    shopee: AD_CAMPAIGN_IMPORT_CONFIG,
};
