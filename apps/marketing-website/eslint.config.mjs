import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".next/", "node_modules/", "dist/"]
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "off"
    }
  }
];
