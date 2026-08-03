import { prisma } from "@/server/database/prisma";

export async function listCompanies() {
    return prisma.company.findMany({ orderBy: { id: "asc" } });
}

export async function getCompanyById(id: bigint) {
    return prisma.company.findUnique({ where: { id } });
}

export async function saveShopeeCredentials(
    companyId: bigint,
    credentials: { shopId: string; accessToken: string; refreshToken: string; expiresAt: Date },
) {
    return prisma.company.update({
        where: { id: companyId },
        data: {
            shopeeShopId: credentials.shopId,
            shopeeAccessToken: credentials.accessToken,
            shopeeRefreshToken: credentials.refreshToken,
            shopeeTokenExpiresAt: credentials.expiresAt,
        },
    });
}

export async function clearShopeeCredentials(companyId: bigint) {
    return prisma.company.update({
        where: { id: companyId },
        data: {
            shopeeShopId: null,
            shopeeAccessToken: null,
            shopeeRefreshToken: null,
            shopeeTokenExpiresAt: null,
        },
    });
}

export async function updateGoogleAdsConnection(
    companyId: bigint,
    data: { customerId: string; refreshToken: string }
): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            googleAdsCustomerId: data.customerId,
            googleAdsRefreshToken: data.refreshToken,
        },
    });
}

export async function clearGoogleAdsConnection(companyId: bigint): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: { googleAdsRefreshToken: null },
    });
}

export async function updateFacebookConnection(
    companyId: bigint,
    data: { adAccountId: string; accessToken: string; expiresAt: Date }
): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            facebookAdAccountId: data.adAccountId,
            facebookAccessToken: data.accessToken,
            facebookTokenExpiresAt: data.expiresAt,
        },
    });
}

export async function clearFacebookConnection(companyId: bigint): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            facebookAdAccountId: null,
            facebookAccessToken: null,
            facebookTokenExpiresAt: null,
        },
    });
}