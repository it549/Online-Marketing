"use client";

import { useState } from "react";

import DashboardHeader from "./DashboardHeader";
import DashboardLoading from "./DashboardLoading";
import DashboardError from "./DashboardError";
import PlatformSelector from "./PlatformSelector";
import MetricCards from "./MetricCards";
import DashboardTable from "./DashboardTable";

import { useDashboard } from "@/hooks/useDashboard";
import { Platform } from "@/types/platform";

export default function Dashboard() {
    const [platform, setPlatform] = useState<Platform>("facebook");
    const { data, loading, error } = useDashboard(platform);

    console.log("Dashboard Data:", data);
    return (
        <div className="space-y-6">
            <PlatformSelector value={platform} onChange={setPlatform} />

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <DashboardHeader title={data.title} />

                    <MetricCards metrics={data.metrics} />

                    <DashboardTable table={data.table} />
                </>
            )}
        </div>
    );
}
