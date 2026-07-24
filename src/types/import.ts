export type ImportPlatformCode = "SHOPEE" | "META" | "TIKTOK" | "GOOGLE_ADS";

export interface ImportPlatformOption {
    code: string;
    name: string;
    enabled: boolean;
}

export interface ImportCsvResult {
    importJobId: string;
    status: string;
    filename: string;
    totalRecords: number;
    importedAt: string | null;
}

export interface ImportCsvApiResponse {
    success: boolean;
    data?: ImportCsvResult;
    error?: string;
}
