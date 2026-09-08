import { renderGuide, slugify } from './markdown';

/** Stands in for `Location.prepareExternalUrl` under a subpath deployment. */
const underSubpath = (path: string) => `/ngx-statewise${path}`;
const atRoot = (path: string) => path;

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
    const { html } = renderGuide('# Effects\n\n## Registering Effects', atRoot);

    expect(html).toContain('<h1 id="effects">');
    expect(html).toContain('<h2 id="registering-effects">');
  });

  it('lists h2 and h3 in the table of contents, and leaves h1 out of it', () => {
    const { headings } = renderGuide(
      '# Effects\n\n## Scope\n\n### Lifecycle\n\n#### Ignored',
      atRoot,
    );

    expect(headings).toEqual([
      { id: 'scope', text: 'Scope', depth: 2 },
      { id: 'lifecycle', text: 'Lifecycle', depth: 3 },
    ]);
  });

  it('keeps repeated headings addressable by suffixing the duplicate', () => {
    const { headings } = renderGuide('## Key Notes\n\n## Key Notes', atRoot);

    expect(headings.map((heading) => heading.id)).toEqual([
      'key-notes',
      'key-notes-1',
    ]);
  });

  it("does not carry one page's heading counter into the next", () => {
    const first = renderGuide('## Key Notes', atRoot);
    const second = renderGuide('## Key Notes', atRoot);

    expect(first.headings[0].id).toBe('key-notes');
    expect(second.headings[0].id).toBe('key-notes');
  });

  it('sends a site-absolute link through the base href', () => {
    const { html } = renderGuide('[Scope](/guide/effects#scope)', underSubpath);

    expect(html).toContain('href="/ngx-statewise/guide/effects#scope"');
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

  it('renders GitHub-flavoured tables, which the guide is full of', () => {
    const { html } = renderGuide('| a | b |\n| - | - |\n| 1 | 2 |', atRoot);

    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });
});
