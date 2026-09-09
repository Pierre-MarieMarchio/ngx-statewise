// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

const APP = 'projects/ngx-statewise-showcase/src/app';

/**
 * The four zones of the showcase and their two siblings, and what each one is
 * forbidden to reach for. Read a row as "this zone may not import those".
 *
 * The order matters only for reading: `core` sits at the bottom and knows
 * nothing, `pages` sits at the top and composes everything.
 */
const ZONES = [
  {
    zone: 'core',
    why: 'infrastructure: it must not know a business concept exists',
    denies: ['features', 'shared', 'pages', 'fakeBackend'],
  },
  {
    zone: 'shared/ui',
    why: 'reusable UI, almost extractable: it may use core and nothing above',
    denies: ['features', 'pages', 'fakeBackend'],
  },
  {
    zone: 'features/common',
    why: 'the shared kernel: it imports nothing from this repository at all',
    denies: ['core', 'shared', 'features', 'pages', 'fakeBackend', 'escapes'],
  },
  {
    zone: 'features/auth',
    why: 'no feature imports another feature; the need descends into features/common',
    denies: ['project', 'inspection', 'pages', 'fakeBackend'],
  },
  {
    zone: 'features/project',
    why: 'no feature imports another feature; the need descends into features/common',
    denies: ['auth', 'inspection', 'pages', 'fakeBackend'],
  },
  {
    zone: 'features/inspection',
    why: 'no feature imports another feature; the need descends into features/common',
    denies: ['auth', 'project', 'pages', 'fakeBackend'],
  },
  {
    zone: 'pages',
    why: 'composition: it may reach for any feature and any shared component',
    denies: ['fakeBackend'],
  },
  {
    zone: 'fake-backend',
    why: 'a stand-in for a server: self-contained, wired only by app.config.ts',
    denies: ['core', 'shared', 'features', 'pages'],
  },
];

/** What each denial name expands to, in every form an import can be written. */
const GROUPS = {
  core: ['@app/core', '@app/core/**', '**/core/**'],
  shared: ['@shared/**', '@app/shared/**', '**/shared/**'],
  features: ['@app/features/**', '**/features/**'],
  pages: ['@app/pages/**', '**/pages/**'],
  fakeBackend: [
    '@app/fake-backend',
    '@app/fake-backend/**',
    '**/fake-backend',
    '**/fake-backend/**',
  ],
  // A sibling feature is denied by its bare name as well as by its alias:
  // `../../auth/services` climbs out of features/project without ever writing
  // the word `features`, and a pattern matching the import string cannot see
  // that. No legitimate path inside one feature carries another feature's name,
  // so the bare form costs nothing and closes the climb.
  auth: [
    '@app/features/auth',
    '@app/features/auth/**',
    '**/features/auth/**',
    '**/auth',
    '**/auth/**',
  ],
  project: [
    '@app/features/project',
    '@app/features/project/**',
    '**/features/project/**',
    '**/project',
    '**/project/**',
  ],
  inspection: [
    '@app/features/inspection',
    '@app/features/inspection/**',
    '**/features/inspection/**',
    '**/inspection',
    '**/inspection/**',
  ],
  // Only features/common uses this: inside it, `../<sibling>` is legitimate and
  // `../../anything` always leaves the folder.
  escapes: ['../../*', '../../**', '@testing/**'],
};

function zoneLaws() {
  return ZONES.map(({ zone, why, denies }) => ({
    files: [`${APP}/${zone}/**/*.ts`],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: denies.flatMap((name) => GROUPS[name]),
              message: `${zone}/ — ${why}. See doc/architecture.md, "la loi de dépendance".`,
            },
          ],
        },
      ],
    },
  }));
}

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

  // The showcase's dependency law, enforced rather than documented. Written
  // before the extractions that follow, so no shortcut can reintroduce itself:
  // the alternative is finding the breaches once they are already written.
  //
  // Each zone declares what it may NOT reach for. `no-restricted-imports`
  // matches the import string, not a resolved path, so every zone forbids both
  // the alias form and the relative forms that still carry the segment. The
  // showcase writes every cross-zone import through an alias, which is what
  // makes that enough here — and a deliberate breach in either form is what
  // proves it.
  ...zoneLaws(),

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
