import { renderOptions as options } from '../../testing/render-options';
import { renderGuide, slugify } from './markdown';

/** Stands in for `Location.prepareExternalUrl` under a subpath deployment. */
const underSubpath = options({
  toExternalUrl: (path) => `/ngx-statewise/en${path}`,
});

describe('slugify', () => {
  it('drops punctuation and joins words with hyphens', () => {
    expect(slugify('Defining Effects with `createEffect`')).toBe(
      'defining-effects-with-createeffect',
    );
  });

  it('keeps the anchors the guide used while it was a single README', () => {
    expect(slugify('Dispatching through the right manager')).toBe(
      'dispatching-through-the-right-manager',
    );
    expect(slugify('Migrating from 0.6.x')).toBe('migrating-from-06x');
  });
});

describe('renderGuide', () => {
  it('gives every heading an id, which is what the anchors are made of', () => {
    const { html } = renderGuide(
      '# Effects\n\n## Registering effects',
      options(),
    );

    expect(html).toContain('<h1 id="effects">');
    expect(html).toContain('<h2 id="registering-effects">');
  });

  it('adds a permalink beside every heading but the title', () => {
    const { html } = renderGuide('# Effects\n\n## Scope', options());

    expect(html).toContain('<a class="heading-anchor" href="#scope"');
    // The h1 is the page title; a permalink to the top of the page is noise.
    expect(html).not.toContain('href="#effects"');
  });

  it('lists h2 and h3 in the table of contents, and leaves h1 out of it', () => {
    const { headings } = renderGuide(
      '# Effects\n\n## Scope\n\n### Lifecycle\n\n#### Ignored',
      options(),
    );

    expect(headings).toEqual([
      { id: 'scope', text: 'Scope', depth: 2 },
      { id: 'lifecycle', text: 'Lifecycle', depth: 3 },
    ]);
  });

  it('keeps repeated headings addressable by suffixing the duplicate', () => {
    const { headings } = renderGuide('## Key notes\n\n## Key notes', options());

    expect(headings.map((heading) => heading.id)).toEqual([
      'key-notes',
      'key-notes-1',
    ]);
  });

  it("does not carry one page's heading counter into the next", () => {
    const first = renderGuide('## Key notes', options());
    const second = renderGuide('## Key notes', options());

    expect(first.headings[0].id).toBe('key-notes');
    expect(second.headings[0].id).toBe('key-notes');
  });

  it('sends a site-absolute link through the base href and the locale', () => {
    const { html } = renderGuide('[Scope](/guide/effects#scope)', underSubpath);

    expect(html).toContain('href="/ngx-statewise/en/guide/effects#scope"');
  });

  it('leaves a fragment-only link alone', () => {
    const { html } = renderGuide('[Scope](#scope)', underSubpath);

    expect(html).toContain('href="#scope"');
    expect(html).not.toContain('target="_blank"');
  });

  it('sends an external link to a new tab, without leaking the referrer', () => {
    const { html } = renderGuide('[npm](https://npmjs.com/)', underSubpath);

    expect(html).toContain('href="https://npmjs.com/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it('wraps a fenced block in a copyable code block naming its language', () => {
    const { html } = renderGuide(
      '```typescript\nconst a = 1;\n```',
      options({ copyCodeLabel: 'Copier le code' }),
    );

    expect(html).toContain('class="code-block"');
    expect(html).toContain('class="language-typescript"');
    expect(html).toContain('data-copy-code');
    expect(html).toContain('aria-label="Copier le code"');
    expect(html).toContain('const a = 1;');
  });

  it('escapes code rather than letting it into the document as markup', () => {
    const { html } = renderGuide(
      '```html\n<img src=x onerror="alert(1)">\n```',
      options(),
    );

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('renders GitHub-flavoured tables, which the guide is full of', () => {
    const { html } = renderGuide('| a | b |\n| - | - |\n| 1 | 2 |', options());

    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });
});
