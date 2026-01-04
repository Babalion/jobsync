import next from "eslint-config-next";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "dist/**",
    ],
  },
  ...next,
  {
    rules: {
      "react-hooks/static-components": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];
