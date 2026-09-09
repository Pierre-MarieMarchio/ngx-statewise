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

/**
 * Turns a table of zones into one lint block each. Two applications in this
 * workspace have the same four layers, so they share the mechanism and differ
 * only in their table — a second scheme beside this one would be a second
 * thing to keep true.
 */
function zoneLaws({ app, zones, groups, reference }) {
  return zones.map(({ zone, why, denies }) => ({
    files: [`${app}/${zone}/**/*.ts`],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: denies.flatMap((name) => groups[name]),
              message: `${zone}/ — ${why}. See ${reference}.`,
            },
          ],
        },
      ],
    },
  }));
}

const SHOWCASE_LAW = {
  app: APP,
  zones: ZONES,
  groups: GROUPS,
  reference: 'doc/architecture.md, "la loi de dépendance"',
};

const DOCS_APP = 'projects/ngx-statewise-docs/src/app';

/**
 * The documentation site's zones. Same reading as the showcase's above: each
 * row says what that zone may NOT reach for.
 *
 * `pages/` has no row because it denies nothing — composing the layers below
 * it is its whole job, and only `app.routes.ts` reaches into it.
 */
const DOCS_ZONES = [
  {
    zone: 'core',
    why: "infrastructure: i18n, the site's own UI state and its constants, naming no part of the documentation",
    denies: ['features', 'shared', 'pages'],
  },
  {
    zone: 'shared/ui',
    why: 'presentational and business-free: it may use core and nothing above',
    denies: ['features', 'pages'],
  },
  {
    zone: 'features/guide',
    why: 'no feature imports another feature; what two of them need belongs to core/ or shared/, or is composed in pages/',
    denies: ['flowDemo', 'pages'],
  },
  {
    zone: 'features/flow-demo',
    why: 'no feature imports another feature; what two of them need belongs to core/ or shared/, or is composed in pages/',
    denies: ['guide', 'pages'],
  },
];

/**
 * The docs site writes every cross-layer import relatively, so these are the
 * relative forms — and, for a sibling feature, its bare name too. A pattern
 * matches the import string, not a resolved path: `../flow-demo/index` climbs
 * out of features/guide without ever writing the word `features`, and the
 * shape that would catch it generically — `../!(..)/**` — matches nothing,
 * because no-restricted-imports does not read extglob. `verify:docs` fails if
 * this list and app/features/ stop agreeing.
 */
const DOCS_GROUPS = {
  features: ['**/features/**'],
  shared: ['**/shared/**'],
  pages: ['**/pages/**'],
  guide: [
    '**/features/guide',
    '**/features/guide/**',
    '../guide',
    '../guide/**',
  ],
  flowDemo: [
    '**/features/flow-demo',
    '**/features/flow-demo/**',
    '../flow-demo',
    '../flow-demo/**',
  ],
};

const DOCS_LAW = {
  app: DOCS_APP,
  zones: DOCS_ZONES,
  groups: DOCS_GROUPS,
  reference: 'projects/ngx-statewise-docs/README.md, "The import law"',
};

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

  // Both applications' dependency laws, enforced rather than documented.
  // Written before the extractions that follow, so no shortcut can
  // reintroduce itself: the alternative is finding the breaches once they are
  // already written.
  //
  // Each zone declares what it may NOT reach for. `no-restricted-imports`
  // matches the import string, not a resolved path, so every zone forbids both
  // the alias form and the relative forms that still carry the segment. The
  // showcase writes every cross-zone import through an alias, the docs site
  // writes them relatively, and a deliberate breach in either form is what
  // proves each one.
  ...zoneLaws(SHOWCASE_LAW),
  ...zoneLaws(DOCS_LAW),

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
