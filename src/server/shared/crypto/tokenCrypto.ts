import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM envelope for platform tokens stored in the database:
// "enc:v1:<iv>:<tag>:<ciphertext>" (all base64url). Values without the prefix are
// treated as legacy plaintext and passed through, so existing rows keep working
// until scripts/encrypt-company-tokens.mjs re-saves them.
const PREFIX = "enc:v1:";

let warnedMissingKey = false;

function getKey(): Buffer | null {
    const raw = process.env.TOKEN_ENCRYPTION_KEY;
    if (!raw) return null;

    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
        throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
    }
    return key;
}

export function isEncryptedToken(value: string): boolean {
    return value.startsWith(PREFIX);
}

export function encryptToken(value: string): string;
export function encryptToken(value: string | null): string | null;
export function encryptToken(value: string | null): string | null {
    if (value === null || isEncryptedToken(value)) return value;

    const key = getKey();
    if (!key) {
        if (!warnedMissingKey) {
            warnedMissingKey = true;
            console.warn("TOKEN_ENCRYPTION_KEY is not set -- platform tokens are being stored unencrypted");
        }
        return value;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return PREFIX + [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(":");
}

export function decryptToken(value: string): string;
export function decryptToken(value: string | null): string | null;
export function decryptToken(value: string | null): string | null {
    if (value === null || !isEncryptedToken(value)) return value;

    const key = getKey();
    if (!key) {
        throw new Error("Stored token is encrypted but TOKEN_ENCRYPTION_KEY is not set");
    }

    const [iv, tag, ciphertext] = value
        .slice(PREFIX.length)
        .split(":")
        .map((part) => Buffer.from(part, "base64url"));
    if (!iv || !tag || !ciphertext) {
        throw new Error("Stored token has an invalid encrypted format");
    }

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
