import { z } from "zod";

const configurationEnvShema = z.object({
    GRAPH_FACEBOOK_URL: z.url(),
    META_ACCESS_TOKEN: z.string().min(1),
    META_AD_ACCOUNT_ID: z.string().min(1),
    API_GRAPH_VERSION: z.string(),
});

const env = configurationEnvShema.parse(process.env);

export const config = {
    facebook: {
        baseUrl: env.GRAPH_FACEBOOK_URL,
        apiVersion: env.API_GRAPH_VERSION,
        accessToken: env.META_ACCESS_TOKEN,
        adAccountId: env.META_AD_ACCOUNT_ID,
    },
} as const;
