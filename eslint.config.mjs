import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".seo-toolkit/**", ".agents/**", ".cache/**"] },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
