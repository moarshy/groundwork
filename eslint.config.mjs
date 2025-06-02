import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Make TypeScript rules less strict for development
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn", 
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
      "no-var": "warn"
    }
  },
  {
    // Completely ignore generated files
    ignores: [
      "lib/generated/**/*",
      "**/*.generated.*",
      "**/*runtime*",
      "**/*.wasm.js",
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      ".prisma/**/*"
    ]
  }
];

export default eslintConfig;