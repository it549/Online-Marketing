export interface DashboardMetric {
    id: string;
    label: string;
    value: string | number;
    subtitle?: string;
    color?: string;
}
