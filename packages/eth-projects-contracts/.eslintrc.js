module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ["**/*.js", "dist", "**/*.d.ts"],
};
