// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

/**
 * The library carries a published contract, so it is linted with type-aware
 * strict rules. The showcase is application code and gets a lighter set: its
 * job is to exercise the library, not to be an example of lint compliance.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      'eslint.config.js',
      '**/karma.conf.cjs',
      '.scripts/**',
    ],
  },

  {
    files: ['projects/ngx-statewise/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: [
          'projects/ngx-statewise/tsconfig.lib.json',
          'projects/ngx-statewise/tsconfig.spec.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      // Off on purpose: its autofix turns constructor-injected classes into
      // type-only imports, which erases them at runtime and breaks Angular DI
      // (NG2003). `import type` is used deliberately where it is safe.
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // The internal services are plain-constructible on purpose: their unit
      // specs build them with `new`, without spinning up a TestBed. They are
      // never instantiated by user code, so inject() buys nothing here.
      '@angular-eslint/prefer-inject': 'off',
    },
  },

  {
    files: ['projects/ngx-statewise/**/*.spec.ts'],
    rules: {
      // Specs build throwaway doubles and assert on them; the strict rules
      // aimed at the published surface only get in the way there.
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['projects/ngx-statewise-showcase/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['projects/ngx-statewise-showcase/**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },

  // Last: switches off every rule Prettier already decides.
  prettier,
);
