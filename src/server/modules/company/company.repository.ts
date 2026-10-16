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

export interface GoogleAdsAppCredentialsInput {
    clientId: string;
    loginCustomerId: string;
    // Blank = keep the stored value (secrets are never sent back to the browser).
    clientSecret?: string;
    developerToken?: string;
}

export async function updateGoogleAdsAppCredentials(companyId: bigint, input: GoogleAdsAppCredentialsInput): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            googleAdsClientId: input.clientId || null,
            googleAdsLoginCustomerId: input.loginCustomerId || null,
            ...(input.clientSecret ? { googleAdsClientSecret: encryptToken(input.clientSecret) } : {}),
            ...(input.developerToken ? { googleAdsDeveloperToken: encryptToken(input.developerToken) } : {}),
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
export async function setGoogleAdsCustomerId(companyId: bigint, customerId: string): Promise<void> {
    await prisma.company.update({
        where: { id: companyId },
        data: { googleAdsCustomerId: customerId },
    });
}
