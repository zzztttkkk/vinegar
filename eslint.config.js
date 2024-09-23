import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "plugin:react/jsx-runtime": "off",
      "@typescript-eslint/require-array-sort-compare": 2,
    },
  },
  {
    extends: ["plugin:prettier/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
  },
];
