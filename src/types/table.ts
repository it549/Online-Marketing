export interface TableColumn {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
}

export interface TableRow {
    id: string;
    status?: string;

    [key: string]: unknown;
}

export interface DashboardTable {
    columns: TableColumn[];
    rows: TableRow[];
}
