import { z } from "zod";

const configurationEnvShema = z.object({
    GRAPH_FACEBOOK_URL: z.url(),
    META_ACCESS_TOKEN: z.string().min(1),
    META_AD_ACCOUNT_ID: z.string().min(1),
    API_GRAPH_VERSION: z.string(),

    GROQ_API_KEY: z.string(),

    SHOPEE_PARTNER_ID: z.string(),
    SHOPEE_PARTNER_KEY: z.string().min(1),
    SHOPEE_API_BASE_URL: z.url(),
    SHOPEE_REDIRECT_URL: z.url(),

    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    ACCESS_TOKEN: z.string(),
    REFRESH_TOKEN: z.string(),
    DEVELOPER_TOKEN: z.string(),
    CUSTOMER_ID: z.string(),
    GOOGLE_ADS_REDIRECT_URL: z.url(),

    FACEBOOK_APP_ID: z.string().min(1),
    FACEBOOK_APP_SECRET: z.string().min(1),
    FACEBOOK_REDIRECT_URL: z.url(),
});

const env = configurationEnvShema.parse(process.env);

export const config = {
    facebook: {
        baseUrl: env.GRAPH_FACEBOOK_URL,
        apiVersion: env.API_GRAPH_VERSION,
        accessToken: env.META_ACCESS_TOKEN,
        adAccountId: env.META_AD_ACCOUNT_ID,
        appId: env.FACEBOOK_APP_ID,
        appSecret: env.FACEBOOK_APP_SECRET,
        redirectUrl: env.FACEBOOK_REDIRECT_URL,
    },

    groq: env.GROQ_API_KEY,
    shopee: {
        partnerID: env.SHOPEE_PARTNER_ID,
        partnerKey: env.SHOPEE_PARTNER_KEY,
        apiBaseUrl: env.SHOPEE_API_BASE_URL,
        redirectUrl: env.SHOPEE_REDIRECT_URL,
    },
    google: {
        clientID: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        accessToken: env.ACCESS_TOKEN,
        refreshToken: env.REFRESH_TOKEN,
        develoerToken: env.DEVELOPER_TOKEN,
        customerID: env.CUSTOMER_ID,
        redirectUrl: env.GOOGLE_ADS_REDIRECT_URL,
    }
} as const;
