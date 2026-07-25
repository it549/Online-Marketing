import { parse } from "csv-parse/sync";

import {
    ShopeeParsedReport, ShopeeRawCampaign, ShopeeReportMetadata,
} from "./shopee.types";

function normalizeText(value: string | undefined,): string {
    return value?.trim() ?? "";
}

function parseNumber(value: string | undefined,): number {
    if (!value) {
        return 0;
    }

    const normalizedValue = value.trim().replace(/,/g, "").replace(/%/g, "");
    const parsedValue = Number(normalizedValue);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function parseNullableNumber(value: string | undefined,): number | null {
    if (!value || value.trim() === "-") {
        return null;
    }

    const normalizedValue = value.trim().replace(/,/g, "").replace(/%/g, "");
    const parsedValue = Number(normalizedValue);
    return Number.isNaN(parsedValue) ? null : parsedValue;
}

function parseShopeeDate(value: string | undefined,): Date | null {
    if (!value) {
        return null;
    }

    const normalizedValue = value.trim();
    const match = normalizedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/,);

    if (!match) {
        return null;
    }

    const [, day, month, year, hour = "0", minute = "0"] = match;

    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute),);
}

function parseReportDateRange(value: string,): {
    startDate: Date | null; endDate: Date | null;
} {
    const [startDate, endDate] = value.split("-").map((date) => date.trim());

    return {
        startDate: parseShopeeDate(startDate), endDate: parseShopeeDate(endDate),
    };
}

export function parseShopeeCsv(csvContent: string,): ShopeeParsedReport {
    const lines = csvContent.split(/\r?\n/);
    const metadata: ShopeeReportMetadata = {
        userName: "",
        shopName: "",
        shopId: "",
        reportCreatedAt: null,
        reportStartDate: null,
        reportEndDate: null,
    };

    for (const line of lines) {
        const [key, ...rest] = line.split(",");
        const value = rest.join(",").trim();
        switch (key?.trim()) {
            case "User Name":
                metadata.userName = value;
                break;
            case "ชื่อร้านค้า":
                metadata.shopName = value;
                break;
            case "Shop ID":
                metadata.shopId = value;
                break;
            case "รายงานถูกสร้างเมื่อ":
                metadata.reportCreatedAt = parseShopeeDate(value);
                break;
            case "ระยะเวลา": {
                const dateRange = parseReportDateRange(value);
                metadata.reportStartDate = dateRange.startDate;
                metadata.reportEndDate = dateRange.endDate;
                break;
            }
        }
    }

    const headerIndex = lines.findIndex((line) => line.includes("ลำดับ") && line.includes("ชื่อโฆษณา") && line.includes("ค่าโฆษณา"),);

    if (headerIndex === -1) {
        throw new Error("ไม่พบ Header ของรายงาน Shopee",);
    }

    const campaignCsv = lines.slice(headerIndex).join("\n");
    const records = parse(campaignCsv, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        relax_column_count: true,
        trim: true,
    }) as Record<string, string>[];

    const campaigns: ShopeeRawCampaign[] =
        records.map((row) => ({
            campaignName: normalizeText(row["ชื่อโฆษณา"],), status: normalizeText(row["สถานะ"]), adType: normalizeText(row["ประเภทโฆษณา"],),

            productId: normalizeText(row["รหัสสินค้า"]) || null,
            optimization: normalizeText(row["ปรับแต่ง"]) || null,
            bidStrategy: normalizeText(row["การตั้งราคาประมูล"],) || null,
            placement: normalizeText(row["ตำแหน่ง"]) || null,
            startDate: parseShopeeDate(row["วันที่เริ่มต้น"],),
            endDate: parseShopeeDate(row["วันที่สิ้นสุด"],),
            impressions: parseNumber(row["การมองเห็น"],),
            clicks: parseNumber(row["จำนวนคลิก"],),
            ctr: parseNullableNumber(row["อัตราการคลิก (CTR)"],),
            addToCart: parseNumber(row["Add to Cart"],),
            addToCartRate: parseNullableNumber(row["Add to Cart Rate"],),
            orders: parseNumber(row["การสั่งซื้อ"],),
            directOrders: parseNumber(row["การสั่งซื้อโดยตรง"],),
            conversionRate: parseNullableNumber(row["อัตราการสั่งซื้อ"],),
            directConversionRate: parseNullableNumber(row["อัตราการสั่งซื้อโดยตรง"],),
            costPerOrder: parseNullableNumber(row["ราคาต่อการสั่งซื้อ"],),
            directCostPerOrder: parseNullableNumber(row["ราคาต่อการสั่งซื้อโดยตรง"],),
            unitsSold: parseNumber(row["สินค้าที่ขายแล้ว"],),
            directUnitsSold: parseNumber(row["สินค้าที่ขายแล้วโดยตรง"],),
            revenue: parseNumber(row["ยอดขาย"],),
            directRevenue: parseNumber(row["ยอดขายโดยตรง"],),
            spend: parseNumber(row["ค่าโฆษณา"],),
            roas: parseNullableNumber(row["ยอดขาย/รายจ่าย (ROAS)"],),
            directRoas: parseNullableNumber(row["ผลตอบแทนจากการลงทุนโดยตรง (Direct ROAS)"],),
            acos: parseNullableNumber(row["ACOS"],),
            directAcos: parseNullableNumber(row["อัตราส่วนค่าใช้จ่ายต่อรายได้โดยตรง (Direct ACOS)"],),
            productImpressions: parseNumber(row["การมองเห็นสินค้า"],),
            productClicks: parseNumber(row["จำนวนคลิกสินค้า"],),
            productCtr: parseNullableNumber(row["อัตราการคลิกสินค้า (CTR)"],),
            voucherAmount: parseNumber(row["Voucher Amount"],),
            voucherSales: parseNumber(row["Vouchered Sales"],),
        }));

    return {
        metadata,
        campaigns,
    };
}