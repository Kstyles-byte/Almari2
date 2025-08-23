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
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      // Avoid type-aware lint noise by not requiring project program
      parserOptions: {
        // Intentionally not setting `project` to keep rules lightweight
      },
    },
    rules: {
      // Align with previous, less strict setup
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      // Tolerate unused args/vars prefixed with _
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // General DX tweaks
      "no-console": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-undef": "off",
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
