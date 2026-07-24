import GenericAdsDashboard from "./GenericAdsDashboard";

// Facebook Content (organic posts) currently fits the same generic
// metrics/table/secondaryTable layout as the ad-campaign platforms -- this
// wrapper exists to give it its own file/identity per-platform, per the
// dashboard architecture, without inventing behavior it doesn't need yet.
export default function FacebookContentDashboard() {
    return <GenericAdsDashboard platform="facebook_content" />;
}
