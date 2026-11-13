import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import { tokenRule } from "./eslint-hygiene.mjs";
export default [{
  files: ["src/components/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
  linterOptions: { reportUnusedDisableDirectives: "off" },
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "react-hooks": reactHooks, hygiene: { rules: { "semantic-colours": tokenRule } } },
  rules: { "hygiene/semantic-colours": "error" },
}];