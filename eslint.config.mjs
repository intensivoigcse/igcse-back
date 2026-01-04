import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // General JS files
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,    // Node.js globals
        ...globals.browser, // Browser globals (if you need them)
      },
    },
  },

  // CommonJS-specific files
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },

  // Jest tests + setup files
  {
    files: [
      "**/*.test.js",
      "**/__tests__/**/*.js",
      "jest.setup.js",
    ],
    languageOptions: {
      globals: {
        ...globals.jest, // Jest globals like jest, describe, it, expect
      },
    },
  },
  {
    rules: {
      "no-unused-vars": ["error", { "caughtErrors": "none" }],
    },
  },
]);
