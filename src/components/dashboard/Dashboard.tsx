"use client";

import { useState } from "react";

import PlatformSelector from "./PlatformSelector";
import GenericAdsDashboard from "./GenericAdsDashboard";
import FacebookContentDashboard from "./FacebookContentDashboard";
import ShopeeDashboard from "./ShopeeDashboard";

import { Platform } from "@/types/platform";

export default function Dashboard() {
    const [platform, setPlatform] = useState<Platform>("facebook");

    return (
        <div className="space-y-6">
            <PlatformSelector value={platform} onChange={setPlatform} />

            {platform === "shopee" && <ShopeeDashboard />}

            {platform === "facebook_content" && <FacebookContentDashboard />}

            {(platform === "facebook" || platform === "tiktok") && <GenericAdsDashboard platform={platform} />}
        </div>
    );
}
