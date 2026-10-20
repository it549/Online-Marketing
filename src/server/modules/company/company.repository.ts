import type { Company } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { decryptToken, encryptToken } from "@/server/shared/crypto/tokenCrypto";

// Platform tokens are encrypted at rest -- every Company read/write goes through this file,
// so decrypt on the way out and encrypt on the way in here.
function decryptCompany<T extends Company | null>(company: T): T {
    if (!company) return company;
    return {
        ...company,
        facebookAccessToken: decryptToken(company.facebookAccessToken),
        googleAdsRefreshToken: decryptToken(company.googleAdsRefreshToken),
        googleAdsClientSecret: decryptToken(company.googleAdsClientSecret),
        googleAdsDeveloperToken: decryptToken(company.googleAdsDeveloperToken),
        tiktokAccessToken: decryptToken(company.tiktokAccessToken),
        tiktokAppSecret: decryptToken(company.tiktokAppSecret),
        shopeeAccessToken: decryptToken(company.shopeeAccessToken),
        shopeeRefreshToken: decryptToken(company.shopeeRefreshToken),
    };
}

export async function listCompanies() {
    return (await prisma.company.findMany({ orderBy: { id: "asc" } })).map(decryptCompany);
}

export async function getCompanyById(id: bigint) {
    return decryptCompany(await prisma.company.findUnique({ where: { id } }));
}

export async function saveShopeeCredentials(
    companyId: bigint,
    credentials: { shopId: string; accessToken: string; refreshToken: string; expiresAt: Date },
) {
    return prisma.company.update({
        where: { id: companyId },
        data: {
            shopeeShopId: credentials.shopId,
            shopeeAccessToken: encryptToken(credentials.accessToken),
            shopeeRefreshToken: encryptToken(credentials.refreshToken),
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
            googleAdsRefreshToken: encryptToken(data.refreshToken),
        },
    });
}

// Blank secrets keep the stored value. The refresh token belongs to the OAuth client that
// issued it, so it is dropped only when the client id changes.
export async function saveGoogleAdsSettings(
    companyId: bigint,
    data: {
        clientId: string;
        clientSecret?: string;
        developerToken?: string;
        customerId: string | null;
        loginCustomerId: string | null;
    }
): Promise<void> {
    const current = await prisma.company.findUnique({
        where: { id: companyId },
        select: { googleAdsClientId: true },
    });
    await prisma.company.update({
        where: { id: companyId },
        data: {
            googleAdsClientId: data.clientId,
            googleAdsCustomerId: data.customerId,
            googleAdsLoginCustomerId: data.loginCustomerId,
            ...(data.clientSecret && { googleAdsClientSecret: encryptToken(data.clientSecret) }),
            ...(data.developerToken && { googleAdsDeveloperToken: encryptToken(data.developerToken) }),
            ...(current?.googleAdsClientId !== data.clientId && { googleAdsRefreshToken: null }),
        },
    });
}

export async function clearGoogleAdsConnection(companyId: bigint): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: { googleAdsRefreshToken: null },
    });
}

export async function updateTikTokConnection(
    companyId: bigint,
    data: { advertiserId: string; accessToken: string }
): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            tiktokAdvertiserId: data.advertiserId,
            tiktokAccessToken: encryptToken(data.accessToken),
        },
    });
}

// A blank secret keeps the stored value. The access token belongs to the app that issued it,
// so it is dropped only when the app id changes.
export async function saveTikTokSettings(
    companyId: bigint,
    data: { appId: string; appSecret?: string }
): Promise<void> {
    const current = await prisma.company.findUnique({
        where: { id: companyId },
        select: { tiktokAppId: true },
    });
    await prisma.company.update({
        where: { id: companyId },
        data: {
            tiktokAppId: data.appId,
            ...(data.appSecret && { tiktokAppSecret: encryptToken(data.appSecret) }),
            ...(current?.tiktokAppId !== data.appId && { tiktokAdvertiserId: null, tiktokAccessToken: null }),
        },
    });
}

export async function clearTikTokConnection(companyId: bigint): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: { tiktokAdvertiserId: null, tiktokAccessToken: null },
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
            facebookAccessToken: encryptToken(data.accessToken),
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