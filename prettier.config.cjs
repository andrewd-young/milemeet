module.exports = {
  singleQuote: true,
  trailingComma: "all",
  arrowParens: "avoid",
  semi: false,
  printWidth: 80,
  tabWidth: 2,
  jsxSingleQuote: false,
  bracketSpacing: true,
  bracketSameLine: false,

  plugins: ["@trivago/prettier-plugin-sort-imports"],

  importOrder: [
    "^react$",
    "^react-native$",
    "^expo(.*)$",
    "<THIRD_PARTY_MODULES>",
    "^@/(.*)$",
    "^[./]",
  ],

  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
