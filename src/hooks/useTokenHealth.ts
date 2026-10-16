"use client";

import { useEffect, useState } from "react";
import type { TokenHealth } from "@/types/tokenHealth";

export function useTokenHealth() {
    const [tokens, setTokens] = useState<TokenHealth[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/integrations/token-health")
            .then((response) => (response.ok ? response.json() : { tokens: [] }))
            .then((result) => {
                if (!cancelled) setTokens(result.tokens ?? []);
            })
            .catch(() => {
                // A failed health check shouldn't break the dashboard -- the banner just stays hidden.
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return tokens;
}
