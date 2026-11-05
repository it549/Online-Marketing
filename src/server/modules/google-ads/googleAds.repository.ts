// No segments.date / date filter: without a date segment Google Ads returns lifetime
// totals per campaign (since the campaign started).
export const CAMPAIGN_PERFORMANCE_QUERY = `
    SELECT
        campaign.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value
    FROM campaign
    ORDER BY metrics.cost_micros DESC
`;
