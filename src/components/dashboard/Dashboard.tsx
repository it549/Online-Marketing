"use client";

import { useState } from "react";

import PlatformSelector from "./PlatformSelector";
import GenericAdsDashboard from "./GenericAdsDashboard";
import FacebookDashboard from "./FacebookDashboard";
import ShopeeDashboard from "./ShopeeDashboard";

import { Platform } from "@/types/platform";

export default function Dashboard() {
    const [platform, setPlatform] = useState<Platform>("facebook");

    return (
        <div className="space-y-6">
            <PlatformSelector value={platform} onChange={setPlatform} />

            {platform === "shopee" && <ShopeeDashboard />}

            {platform === "facebook" && <FacebookDashboard />}

            {platform === "tiktok" && <GenericAdsDashboard platform={platform} />}
        </div>
    );
}
