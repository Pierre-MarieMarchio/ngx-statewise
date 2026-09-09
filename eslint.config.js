// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

/**
 * The library carries a published contract, so it is linted with type-aware
 * strict rules. The showcase and the documentation site are application code
 * and get a lighter set: their job is to exercise and to describe the library,
 * not to be an example of lint compliance.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      'eslint.config.js',
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

  {
    files: ['projects/ngx-statewise-docs/**/*.ts'],
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
    files: ['projects/ngx-statewise-docs/**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },

  // The documentation site's import law, which the folder names alone would
  // only imply. Each layer may reach downwards and never sideways or up:
  //
  //   pages/      composes. May import core, features and shared.
  //   features/   the guide, and the live demo on the landing page.
  //               May import core and shared. Never another feature.
  //   shared/ui/  presentational and business-free. May import core.
  //   core/       i18n, the site's own UI state, the site's constants.
  //               Imports nothing else under app/.
  //
  // Only app.routes.ts reaches into pages/, which is why nothing below is
  // allowed to. Paths are matched as written, so a layer is named by the
  // segment a relative import has to climb through to reach it.
  {
    files: ['projects/ngx-statewise-docs/src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/pages/**', '**/shared/**'],
              message:
                'core/ is infrastructure: it names no part of the documentation, and imports nothing else under app/.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['projects/ngx-statewise-docs/src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/pages/**'],
              message:
                'shared/ui/ is presentational and business-free. It may import core/, and nothing above it.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['projects/ngx-statewise-docs/src/app/features/*/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/pages/**'],
              message:
                'a feature does not reach into a page. The page composes the feature, not the other way round.',
            },
            {
              // Named one by one, because the shape that would express this in
              // one line — `../!(..)/**`, "one level up, but not `../..`" —
              // matches nothing here: no-restricted-imports does not read
              // extglob, so such a pattern silently guards no import at all.
              // `verify:docs` fails if this list stops matching app/features/.
              group: [
                '../guide',
                '../guide/**',
                '../flow-demo',
                '../flow-demo/**',
                '../../features/**',
              ],
              message:
                'no feature imports another feature. What two features both need belongs to core/ or shared/, or is composed in pages/.',
            },
          ],
        },
      ],
    },
  },

  // The compatibility fixture. Not type-aware on purpose: `ngx-statewise`
  // resolves there only through the root tsconfig's mapping to `dist/`, which
  // does not exist yet when `check` reaches the lint step. Its type-check is a
  // step of its own, after the library is built — see `typecheck:tools`.
  {
    files: ['tools/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
  },

  {
    files: ['tools/**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },

  // Last: switches off every rule Prettier already decides.
  prettier,
);
