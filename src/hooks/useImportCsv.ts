"use client";

import { useState } from "react";
import { ImportCsvResult } from "@/types/import";
import { uploadImportCsv } from "@/services/importCsv.service";

export function useImportCsv(endpoint: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportCsvResult | null>(null);

    async function submit(file: File, platformCode: string) {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await uploadImportCsv(file, platformCode, endpoint);
            setResult(response.data ?? null);
            return response.data ?? null;
        } catch (err) {
            setError(err instanceof Error ? err.message : "นำเข้าไฟล์ไม่สำเร็จ");
            return null;
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setError(null);
        setResult(null);
    }

    return {
        loading,
        error,
        result,
        submit,
        reset,
    };
}
