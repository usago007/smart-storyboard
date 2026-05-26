import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 遗留区（已从主链路移除，第二阶段再决定去留）
    "src/app/_api/**",
    "src/storage/**",
    "src/lib/llm-client.ts",
    "src/lib/mock-data.ts",
    "src/lib/model-config.ts",
    "src/utils/imageProcessor.ts",
  ]),
]);

export default eslintConfig;
