// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const js = require("@eslint/js");
const globals = require("globals");
const importPlugin = require("eslint-plugin-import");

console.log('Loading ESLint configuration...');

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    plugins: { js, import: importPlugin },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/common",
              from: [ // Common can import nothing
                "./src/domain",
                "./src/enactment",
                "./src/infrastructure",
                "./src/integration",
                "./src/presentation",
              ],
              message: "Common layer must not import from any other layer.",
            },
            {
              target: "./src/domain",
              from: [  // Domain can only import from Common
                "./src/enactment", 
                "./src/infrastructure", 
                "./src/integration", 
                "./src/presentation"
              ],
              message: "Domain layer must only import from Common.",
            },
            {
              target: "./src/enactment",
              from: [ // Enactment can import from Domain and Common
                "./src/infrastructure",
                "./src/integration",
                "./src/presentation",
              ],
              message: "Enactment layer must only import from Domain and Common.",
            },
            {
              target: "./src/infrastructure",
              from: [ // Infrastructure can import from Enactment, Domain, and Common
                "./src/integration",
                "./src/presentation",
              ],
              message: "Infrastructure layer must only import from Enactment, Domain, and Common.",
            },
            {
              target: "./src/integration",
              from: [ // Integration can import from anywhere
              ],
              message: "Integration layer must only import from Infrastructure, Enactment, Domain, and Common.",
            },
            {
              target: "./src/presentation",
              from: [  
                "./src/domain",
                "./src/enactment",
                "./src/infrastructure"], // Presentation can import from common and integration
              message: "Presentation layer can import from any other layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
