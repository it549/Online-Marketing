import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        // src/tests/** holds pre-existing manual debug scripts (no describe/it blocks,
        // run by hand against fixture files) -- keep those out of the automated suite.
        exclude: ["**/node_modules/**", "src/tests/**"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
