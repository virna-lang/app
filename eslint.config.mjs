import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Permitir `any` em componentes de dashboard (dados dinâmicos do Supabase)
      "@typescript-eslint/no-explicit-any": "warn",
      // setState dentro de effect: padrão legado nos filtros, aceitar como warning
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
