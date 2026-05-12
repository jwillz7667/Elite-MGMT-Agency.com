// =============================================================================
// Elite MGMT Agency · ESLint flat config
// https://eslint.org/docs/latest/use/configure/configuration-files
// =============================================================================

import js from '@eslint/js';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.lighthouseci/**',
      'extracted/**',
      '**/*.min.js',
    ],
  },

  // Recommended rules baseline
  js.configs.recommended,

  // Browser script — our own client code in `assets/js/`
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Project-specific globals we expose intentionally
        __emaMenu: 'writable',
      },
    },
    rules: {
      'no-var': 'off', // IIFE uses var for broadest compat — intentional
      'prefer-const': 'off',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-implicit-globals': 'error',
      'eqeqeq': ['error', 'smart'],
      'curly': ['error', 'multi-line'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-irregular-whitespace': 'error',
      'no-shadow': 'warn',
      'consistent-return': 'warn',
      'default-case-last': 'error',
      'radix': 'error',
      'yoda': ['error', 'never'],
      'no-prototype-builtins': 'error',
    },
  },

  // Node-based tooling scripts (build/validate/audit helpers)
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,mjs}', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
