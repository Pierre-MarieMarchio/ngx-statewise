/**
 * That the guide's TypeScript examples compile.
 *
 * A guide's code is the part readers copy, and it was the one part nothing
 * checked. The audit that led to this script found an example reading `task.id`
 * off a handler whose payload is declared `payload<string>()`: it had been on
 * the site for as long as the page had, and the compiler would have caught it
 * on the first run.
 *
 * Examples are not programs, so they are not compiled as programs. Each block
 * is wrapped in whatever context its shape implies — a class body for a block
 * of members, a `defineUpdater` for a block of `on(...)` handlers — and the
 * world they all name is declared once, in `guide-examples/fixture.ts`. That
 * fixture is the reason an example can stay as short as a reader needs.
 *
 * Three fence flags change what happens to a block:
 *
 *   `signature`      the block is a type signature rather than code, as most
 *                    of the API page is. Not compiled.
 *   `fragment`       the block is a piece of a larger literal and cannot stand
 *                    alone. Not compiled. Reach for it last: an example that
 *                    cannot be compiled is an example nothing checks.
 *   `compile-error`  the block MUST fail to compile. The guide claims in
 *                    several places that something is a compile error, and
 *                    this is what holds it to that.
 *
 * `parseFenceInfo` in the site's markdown renderer ignores words it does not
 * know, so these three are invisible to the rendered page.
 *
 * Runs in `npm run check`, after `build:library`: the examples are type-checked
 * against the built package, through the same `exports` map a consumer resolves.
 */
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = join(
  root,
  'projects/ngx-statewise-docs/src/app/features/guide/content/en',
);
/*
 * Deliberately not under node_modules. TypeScript suppresses *semantic*
 * diagnostics for files it finds in there, so a case with an unresolved name
 * or a missing implementation compiles clean and this script reports success.
 * Syntax errors still surface, which is what makes the mistake so quiet: the
 * first run of this script found three of them and passed everything else.
 */
const workspace = join(root, 'dist', 'guide-examples');

const problems = [];

function fail(message) {
  problems.push(message);
}

// --- reading the blocks ----------------------------------------------------

const FENCE = /^```typescript([^\n]*)\n([\s\S]*?)^```$/gm;

/** A word on the fence, so `typescript avoid title="x.ts"` is three things. */
function flagsOf(info) {
  return new Set(
    info
      .replace(/title="[^"]*"/, '')
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0),
  );
}

const blocks = [];

for (const file of readdirSync(content)
  .filter((name) => name.endsWith('.md'))
  .sort()) {
  const markdown = readFileSync(join(content, file), 'utf8');
  let match;
  let ordinal = 0;

  while ((match = FENCE.exec(markdown)) !== null) {
    ordinal += 1;

    const flags = flagsOf(match[1] ?? '');
    const body = match[2] ?? '';
    // The line the block starts on, so a failure names somewhere to look.
    const line = markdown.slice(0, match.index).split('\n').length;

    blocks.push({ file, ordinal, line, flags, body });
  }
}

if (blocks.length === 0) {
  fail(
    `no typescript blocks found under ${content} — this script is out of step`,
  );
}

// --- wrapping each one in the context its shape implies --------------------

/** The first line that is neither blank nor a comment, JSDoc included. */
function opensWith(body) {
  return (
    body
      .split('\n')
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !line.startsWith('//') &&
          !line.startsWith('/*') &&
          !line.startsWith('*'),
      ) ?? ''
  );
}

/**
 * What the fixture offers, split by whether a name is a value or a type. A
 * type cannot be destructured out of a namespace import, and a generic one
 * cannot be aliased without repeating its parameters, so the two are imported
 * differently below.
 */
const fixture = (() => {
  const source = readFileSync(
    join(root, 'scripts', 'guide-examples', 'fixture.ts'),
    'utf8',
  );
  const values = new Set();
  const types = new Set();

  for (const declaration of source.matchAll(
    /^export (const|function|class|interface|type) (\w+)/gm,
  )) {
    const [, kind, name] = declaration;

    (kind === 'interface' || kind === 'type' ? types : values).add(name);
  }

  // `export { X as Y };` re-publishes a class, so a value.
  for (const aliased of source.matchAll(/^export \{ \w+ as (\w+) \};/gm)) {
    values.add(aliased[1]);
  }

  if (values.size === 0) {
    fail(
      'nothing readable in guide-examples/fixture.ts — this script is out of step',
    );
  }

  return { values, types };
})();

/** The library's own surface, as the API page commits to it. */
const LIBRARY_VALUES = [
  'ActionHistory',
  'createEffect',
  'createInterceptor',
  'defineActionsGroup',
  'defineSingleAction',
  'defineUpdater',
  'emptyPayload',
  'injectStatewise',
  'ofType',
  'payload',
  'provideStatewise',
  'requestStatus',
];
const LIBRARY_TYPES = [
  'Action',
  'ActionIdentity',
  'ActionPayloadOf',
  'ActionRedaction',
  'AnyActionCreator',
  'EffectConcurrency',
  'EffectContext',
  'EffectHandler',
  'EffectOptions',
  'EffectOutcome',
  'EffectRef',
  'HistoryEntry',
  'InterceptorHandler',
  'InterceptorRef',
  'MisroutedDispatchReaction',
  'Statewise',
  'StatewiseConfig',
  'StatewiseHistoryOptions',
  'Updater',
];
const TESTING_VALUES = [
  'provideStatewiseTesting',
  'drainEffects',
  'captureStatewiseDeclarations',
];
const TESTING_TYPES = ['StatewiseTestingConfig'];

const ANGULAR_VALUES = [
  'Injectable',
  'inject',
  'signal',
  'computed',
  'provideAppInitializer',
  'PLATFORM_ID',
];
const RXJS_VALUES = ['EMPTY', 'of', 'Observable', 'firstValueFrom'];
const RXJS_OPERATORS = ['map', 'catchError', 'switchMap'];

/** Every identifier the block mentions. Crude on purpose, and only ever a superset. */
function mentioned(body) {
  return new Set(
    [...body.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)].map(
      (match) => match[1],
    ),
  );
}

/**
 * Names the block introduces itself. Importing one of these would collide, and
 * a page that declares `loginActions` in front of the reader is doing the right
 * thing.
 */
function declaredBy(body) {
  const names = new Set();

  for (const declaration of body.matchAll(
    /\b(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
  )) {
    names.add(declaration[1]);
  }

  // What the block imports for itself counts too. Several pages open with the
  // import line on purpose, because the first question about a helper is where
  // it comes from, and importing it twice is a duplicate identifier.
  for (const clause of body.matchAll(
    /^import\s+(?:type\s+)?\{([^}]*)\}\s+from/gm,
  )) {
    for (const specifier of clause[1].split(',')) {
      const local = specifier
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();

      if (local !== undefined && local.length > 0) {
        names.add(local);
      }
    }
  }

  for (const namespaced of body.matchAll(
    /^import\s+(?:\*\s+as\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s+from/gm,
  )) {
    names.add(namespaced[1]);
  }

  return names;
}

/** One import line, or nothing when the block reaches for none of it. */
function importing(names, from, wanted, kind = '') {
  const taken = wanted.filter((name) => names.has(name));

  return taken.length === 0
    ? []
    : [`import ${kind}{ ${taken.join(', ')} } from '${from}';`];
}

const FIXTURE_MODULE = '../../../scripts/guide-examples/fixture';

/**
 * The context a block is compiled in: what it mentions and does not declare,
 * and nothing else.
 *
 * Importing the whole world instead would be simpler and wrong. A block that
 * declares `loginActions` for the reader would collide with an import of it,
 * and the collision is not the example's fault.
 */
function preludeFor(body) {
  const used = mentioned(body);
  const declared = declaredBy(body);
  const names = new Set([...used].filter((name) => !declared.has(name)));

  return [
    `/* eslint-disable */`,
    ...importing(names, '@angular/core', ANGULAR_VALUES),
    ...importing(
      names,
      '@angular/core',
      ['ApplicationConfig', 'Type'],
      'type ',
    ),
    ...importing(names, '@angular/core/testing', ['TestBed']),
    ...importing(names, '@angular/router', ['Router']),
    ...importing(names, '@angular/common', ['isPlatformBrowser']),
    ...importing(names, 'rxjs', RXJS_VALUES),
    ...importing(names, 'rxjs/operators', RXJS_OPERATORS),
    ...importing(names, 'ngx-statewise', LIBRARY_VALUES),
    ...importing(names, 'ngx-statewise', LIBRARY_TYPES, 'type '),
    ...importing(names, 'ngx-statewise/testing', TESTING_VALUES),
    ...importing(names, 'ngx-statewise/testing', TESTING_TYPES, 'type '),
    ...importing(names, FIXTURE_MODULE, [...fixture.values]),
    ...importing(names, FIXTURE_MODULE, [...fixture.types], 'type '),
    // The test globals, declared rather than imported: no runner is installed
    // for this check and none is needed.
    ...(['it', 'describe', 'expect', 'beforeEach', 'afterEach', 'vi'].some(
      (name) => names.has(name),
    )
      ? [
          `declare const it: (name: string, body: () => unknown) => void;`,
          `declare const describe: (name: string, body: () => unknown) => void;`,
          `declare const beforeEach: (body: () => unknown) => void;`,
          `declare const afterEach: (body: () => unknown) => void;`,
          `declare const expect: any;`,
          `declare const vi: { fn(): any };`,
        ]
      : []),
    ``,
  ].join('\n');
}

/**
 * The context a block needs around it, read off its first meaningful line.
 *
 * Inferred rather than declared on the fence: sixty-six of the guide's blocks
 * are fragments of one of these four shapes, and a word on every one of them
 * would be sixty-six words of bookkeeping in the prose for a reader who does
 * not care.
 */
function wrap(body) {
  const first = opensWith(body);

  if (/^on\(/.test(first)) {
    return `defineUpdater(GuideState, (on) => {\n${body}\n});`;
  }

  if (/^(public|private|protected|readonly)\b/.test(first)) {
    return [
      `@Injectable({ providedIn: 'root' })`,
      `class Example {`,
      `  private readonly statewise = injectStatewise();`,
      `  private readonly state = inject(GuideState);`,
      `  private readonly authStates = inject(GuideState);`,
      `  private readonly states = inject(GuideState);`,
      `  private readonly api = inject(GuideApi);`,
      `  private readonly repository = inject(GuideApi);`,
      `  private readonly auth = inject(GuideApi);`,
      `  private readonly router = inject(Router);`,
      `  private readonly audit = inject(AuditService);`,
      `  private readonly projectManager = inject(ProjectManager);`,
      `  private readonly taskManager = inject(TaskManager);`,
      `  private readonly socket = inject(SocketService);`,
      `  private readonly userService = inject(GuideApi);`,
      `  private readonly authRepository = inject(GuideApi);`,
      `  private readonly authTokenService = inject(AuthTokenService);`,
      `  private readonly authManager = inject(AuthManager);`,
      `  private readonly storage = inject(SettingsStorage);`,
      `  private readonly tallyState = inject(TallyState);`,
      `  private readonly form = { getRawValue: (): LoginSubmit => ({ email: '', password: '' }) };`,
      body
        .split('\n')
        .map((line) => (line.length > 0 ? `  ${line}` : line))
        .join('\n'),
      `}`,
    ].join('\n');
  }

  // Statements, which may reach for `this` and may await.
  return [
    `@Injectable({ providedIn: 'root' })`,
    `class Example {`,
    `  private readonly statewise = injectStatewise();`,
    `  private readonly state = inject(GuideState);`,
    `  private readonly states = inject(GuideState);`,
    `  private readonly api = inject(GuideApi);`,
    `  private readonly auth = inject(GuideApi);`,
    `  private readonly router = inject(Router);`,
    `  private readonly socket = inject(SocketService);`,
    `  private readonly projectManager = inject(ProjectManager);`,
    `  private readonly taskManager = inject(TaskManager);`,
    `  private readonly profile = { load: (id: string): Promise<void> => Promise.resolve() };`,
    `  private readonly audit = inject(AuditService);`,
    `  private readonly details = { load: (id: number): void => {} };`,
    // `unknown` rather than `void`: several snippets are the inside of an
    // effect handler and end in `return someAction(...)`.
    `  public async run(): Promise<unknown> {`,
    // The guide writes a bare `statewise` where a manager would say
    // `this.statewise`, because the snippet is about the call and not about
    // where the handle lives. Same for the other names a snippet assumes.
    `    const statewise = injectStatewise();`,
    `    const authManager = injectStatewise();`,
    `    const taskManager = injectStatewise();`,
    `    const credentials: LoginSubmit = { email: '', password: '' };`,
    `    const email = ''; const password = '';`,
    `    const id = '';`,
    `    const tasks = manager();`,
    `    const query = '';`,
    body
      .split('\n')
      .map((line) => (line.length > 0 ? `    ${line}` : line))
      .join('\n'),
    // Reached only by a snippet that does not return one of its own, which is
    // most of them. `unknown` above is what lets the others end in an action.
    `    return undefined;`,
    `  }`,
    `}`,
  ].join('\n');
}

/**
 * A relative import in an example points at a sibling file the reader has, and
 * here that sibling is the fixture. Rewritten rather than refused: `./tally.action`
 * is how the showcase's own file opens, and quoting it verbatim is the point.
 */
function resolveSiblingImports(source) {
  return source.replace(/from '\.\.?\/[^']*'/g, `from '${FIXTURE_MODULE}'`);
}

/** A module-shaped block compiles as written. */
function isModule(body) {
  return /^(export |import |@Injectable|const |let |function |interface |type |class |declare )/.test(
    opensWith(body),
  );
}

// --- writing them out ------------------------------------------------------

rmSync(workspace, { recursive: true, force: true });
mkdirSync(join(workspace, 'cases'), { recursive: true });

const cases = [];

for (const block of blocks) {
  if (block.flags.has('signature') || block.flags.has('fragment')) {
    continue;
  }

  const name = `${block.file.replace(/\.md$/, '')}-${String(block.ordinal).padStart(2, '0')}`;
  const source = resolveSiblingImports(
    isModule(block.body) ? block.body : wrap(block.body),
  );
  const path = join(workspace, 'cases', `${name}.ts`);

  // Read off the wrapped source rather than the block: a wrapper names the
  // fixture classes its scaffolding injects, and those need importing too.
  writeFileSync(path, `${preludeFor(source)}${source}\n`);

  cases.push({ ...block, name, path });
}

writeFileSync(
  join(workspace, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        // Deliberately not the workspace's strictest set. What is under test is
        // whether the example is *valid*, not whether it would pass this
        // repository's lint: a snippet legitimately leaves a value unused.
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: false,
        exactOptionalPropertyTypes: false,
        skipLibCheck: true,
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        experimentalDecorators: false,
        emitDecoratorMetadata: false,
        noEmit: true,
        types: [],
        // No `baseUrl`: it is deprecated, and the two mappings below are
        // absolute already.
        paths: {
          'ngx-statewise': [join(root, 'dist/ngx-statewise')],
          'ngx-statewise/testing': [join(root, 'dist/ngx-statewise/testing')],
        },
      },
      include: ['cases/**/*.ts'],
    },
    null,
    2,
  ),
);

// --- compiling -------------------------------------------------------------

/**
 * `tsc` over the whole set, then its diagnostics attributed back per case.
 *
 * One run rather than one per case, which is the difference between a second
 * and a minute. The cost is that `tsc` withholds every semantic diagnostic
 * while any syntax error stands anywhere in the program, so a first failure
 * can hide a second round of them. The message says so.
 */
function diagnose() {
  try {
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
        '-p',
        'tsconfig.json',
        '--pretty',
        'false',
      ],
      { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );

    return new Map();
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    const byCase = new Map();

    for (const line of output.split('\n')) {
      const located = /^cases[\\/]([^(]+)\.ts\((\d+),(\d+)\): (.*)$/.exec(line);

      if (located === null) {
        continue;
      }

      const [, name, , , message] = located;
      const existing = byCase.get(name) ?? [];

      existing.push(message);
      byCase.set(name, existing);
    }

    if (byCase.size === 0 && output.trim().length > 0) {
      fail(
        `tsc said something this script cannot attribute:\n${output.trim()}`,
      );
    }

    return byCase;
  }
}

const failures = diagnose();

for (const example of cases) {
  const errors = failures.get(example.name) ?? [];
  const where = `${example.file}:${example.line}`;
  const mustFail = example.flags.has('compile-error');

  if (mustFail && errors.length === 0) {
    fail(
      `${where} is marked \`compile-error\` and compiles.\n` +
        `  Either the example no longer demonstrates the error the prose ` +
        `claims, or the library started accepting it.`,
    );
    continue;
  }

  if (!mustFail && errors.length > 0) {
    fail(
      `${where} does not compile:\n` +
        errors
          .slice(0, 4)
          .map((message) => `      ${message}`)
          .join('\n') +
        (errors.length > 4
          ? `\n      … and ${String(errors.length - 4)} more`
          : '') +
        `\n  The example is at ${example.path} as it was compiled.`,
    );
  }
}

// --- verdict ---------------------------------------------------------------

if (problems.length > 0) {
  console.error(
    `verify:examples — ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n\n` +
      problems.map((problem) => `- ${problem}`).join('\n'),
  );
  process.exit(1);
}

const skipped = blocks.length - cases.length;
const expectedToFail = cases.filter((example) =>
  example.flags.has('compile-error'),
).length;

console.log(
  `verify:examples — ${cases.length} of ${blocks.length} TypeScript blocks ` +
    `type-checked against dist/ngx-statewise` +
    (expectedToFail > 0
      ? `, ${expectedToFail} of them held to failing as the prose claims`
      : '') +
    `; ${skipped} skipped as signatures or fragments.`,
);
