import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken, isEncryptedToken } from "./tokenCrypto";

const KEY = Buffer.alloc(32, 7).toString("base64");

describe("tokenCrypto", () => {
    beforeEach(() => {
        process.env.TOKEN_ENCRYPTION_KEY = KEY;
    });
    afterEach(() => {
        delete process.env.TOKEN_ENCRYPTION_KEY;
    });

    it("round-trips and does not store plaintext", () => {
        const encrypted = encryptToken("secret-token");
        expect(isEncryptedToken(encrypted)).toBe(true);
        expect(encrypted).not.toContain("secret-token");
        expect(decryptToken(encrypted)).toBe("secret-token");
    });

    it("uses a fresh IV per encryption", () => {
        expect(encryptToken("same")).not.toBe(encryptToken("same"));
    });

    it("passes null and legacy plaintext through", () => {
        expect(encryptToken(null)).toBeNull();
        expect(decryptToken(null)).toBeNull();
        expect(decryptToken("legacy-plaintext")).toBe("legacy-plaintext");
    });

    it("rejects tampered ciphertext", () => {
        const encrypted = encryptToken("secret-token");
        const tampered = encrypted.slice(0, -2) + (encrypted.endsWith("AA") ? "BB" : "AA");
        expect(() => decryptToken(tampered)).toThrow();
    });

    it("refuses to decrypt without a key", () => {
        const encrypted = encryptToken("secret-token");
        delete process.env.TOKEN_ENCRYPTION_KEY;
        expect(() => decryptToken(encrypted)).toThrow(/TOKEN_ENCRYPTION_KEY/);
    });
});
