// One-off: encrypts platform tokens already stored as plaintext in companies.
// Requires TOKEN_ENCRYPTION_KEY (see .env.example). Safe to re-run -- values that are
// already encrypted are skipped. Run with: node scripts/encrypt-company-tokens.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { encryptToken, isEncryptedToken } from "../src/server/shared/crypto/tokenCrypto.ts";

const FIELDS = ["facebookAccessToken", "googleAdsRefreshToken", "tiktokAccessToken", "shopeeAccessToken", "shopeeRefreshToken"];

if (!process.env.TOKEN_ENCRYPTION_KEY) {
    console.error("TOKEN_ENCRYPTION_KEY is not set -- refusing to run.");
    process.exit(1);
}

const prisma = new PrismaClient();

try {
    for (const company of await prisma.company.findMany()) {
        const data = {};
        for (const field of FIELDS) {
            const value = company[field];
            if (value && !isEncryptedToken(value)) data[field] = encryptToken(value);
        }

        if (Object.keys(data).length === 0) continue;
        await prisma.company.update({ where: { id: company.id }, data });
        console.log(`Encrypted ${Object.keys(data).join(", ")} for company ${company.code}`);
    }
} finally {
    await prisma.$disconnect();
}
