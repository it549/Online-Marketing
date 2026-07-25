import crypto from "crypto";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
    userId: string;
    email: string;
    role: string;
    exp: number;
}

function getSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET environment variable is not set");
    }
    return secret;
}

function sign(data: string): string {
    return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
    const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
    const signature = sign(body);
    return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
    if (!token) return null;

    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const expectedSignature = sign(body);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}
