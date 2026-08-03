export const CAMPAIGN_PERFORMANCE_QUERY = `
    SELECT
        campaign.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        segments.date
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY segments.date DESC
`;