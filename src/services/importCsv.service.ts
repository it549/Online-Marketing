import { ImportCsvApiResponse } from "@/types/import";

export async function uploadImportCsv(file: File, platformCode: string, endpoint: string): Promise<ImportCsvApiResponse> {
    if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("รองรับเฉพาะไฟล์ .csv เท่านั้น");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("platformCode", platformCode);

    const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
    });

    const result: ImportCsvApiResponse = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error ?? "นำเข้าไฟล์ไม่สำเร็จ");
    }

    return result;
}
