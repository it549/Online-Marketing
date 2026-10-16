// One-off: gives each company its own Google Ads setup (no shared env credentials).
//  - Nilaphatra (company-2): copies CLIENT_ID / CLIENT_SECRET / DEVELOPER_TOKEN / CUSTOMER_ID
//    from .env into its own company row (secrets encrypted with TOKEN_ENCRYPTION_KEY).
//  - รังสิโย (rungsiyo): clears the customer id + refresh token it inherited from Nilaphatra.
// Run with: node scripts/split-google-ads.mjs   (safe to re-run; delete afterwards)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { encryptToken } from "../src/server/shared/crypto/tokenCrypto.ts";

const need = ["CLIENT_ID", "CLIENT_SECRET", "DEVELOPER_TOKEN", "CUSTOMER_ID"];
const missing = need.filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`Missing in .env: ${missing.join(", ")}`);
    process.exit(1);
}

const prisma = new PrismaClient();

try {
    await prisma.company.update({
        where: { code: "company-2" },
        data: {
            googleAdsClientId: process.env.CLIENT_ID,
            googleAdsClientSecret: encryptToken(process.env.CLIENT_SECRET),
            googleAdsDeveloperToken: encryptToken(process.env.DEVELOPER_TOKEN),
            googleAdsLoginCustomerId: process.env.CUSTOMER_ID.replace(/-/g, ""),
        },
    });

    await prisma.company.update({
        where: { code: "rungsiyo" },
        data: { googleAdsCustomerId: null, googleAdsRefreshToken: null },
    });

    const rows = await prisma.company.findMany();
    for (const row of rows) {
        console.log(row.code, {
            customer: row.googleAdsCustomerId,
            mcc: row.googleAdsLoginCustomerId,
            clientId: !!row.googleAdsClientId,
            clientSecret: !!row.googleAdsClientSecret,
            developerToken: !!row.googleAdsDeveloperToken,
            refreshToken: !!row.googleAdsRefreshToken,
        });
    }
} finally {
    await prisma.$disconnect();
}
