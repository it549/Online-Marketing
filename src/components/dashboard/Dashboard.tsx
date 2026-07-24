"use client";

import { useState } from "react";

import DashboardHeader from "./DashboardHeader";
import DashboardLoading from "./DashboardLoading";
import DashboardError from "./DashboardError";
import PlatformSelector from "./PlatformSelector";
import MetricCards from "./MetricCards";
import DashboardTable from "./DashboardTable";
import ImportCsvButton from "./ImportCsvButton";
import DashboardEmptyState from "./DashboardEmptyState";

import { useDashboard } from "@/hooks/useDashboard";
import { Platform } from "@/types/platform";
import { IMPORT_CONFIG_BY_PLATFORM } from "@/constants/importConfig";

export default function Dashboard() {
    const [platform, setPlatform] = useState<Platform>("facebook");
    const { data, loading, error, refetch } = useDashboard(platform);
    const importConfig = IMPORT_CONFIG_BY_PLATFORM[platform];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PlatformSelector value={platform} onChange={setPlatform} />

                <ImportCsvButton onImported={refetch} endpoint={importConfig.endpoint} platforms={importConfig.platforms} />
            </div>

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <DashboardHeader title={data.title} subtitle={data.subtitle} />

                    {data.hasData === false ? (
                        <DashboardEmptyState onImported={refetch} endpoint={importConfig.endpoint} platforms={importConfig.platforms} />
                    ) : (
                        <>
                            <MetricCards metrics={data.metrics} />

                            <DashboardTable table={data.table} />

                            {data.secondaryTable && (
                                <DashboardTable table={data.secondaryTable.table} title={data.secondaryTable.title} />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
