import { describe, expect, it } from "vitest";
import { clearLoginFailures, getRetryAfterSeconds, recordLoginFailure } from "./loginRateLimit";

describe("loginRateLimit", () => {
    it("blocks after 5 failures and recovers after the window", () => {
        const keys = ["ip:test-block"];
        const t0 = 1_000_000;

        for (let i = 0; i < 4; i++) recordLoginFailure(keys, t0 + i);
        expect(getRetryAfterSeconds(keys, t0 + 10)).toBe(0);

        recordLoginFailure(keys, t0 + 4);
        expect(getRetryAfterSeconds(keys, t0 + 10)).toBeGreaterThan(0);
        expect(getRetryAfterSeconds(keys, t0 + 16 * 60 * 1000)).toBe(0);
    });

    it("clears failures for a key", () => {
        const keys = ["email:test-clear"];
        for (let i = 0; i < 5; i++) recordLoginFailure(keys, 1);
        clearLoginFailures(keys);
        expect(getRetryAfterSeconds(keys, 2)).toBe(0);
    });
});
