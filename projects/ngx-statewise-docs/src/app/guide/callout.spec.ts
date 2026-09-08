import {
  TEST_CALLOUT_LABELS as LABELS,
  renderOptions,
} from '../../testing/render-options';
import { CALLOUT_KINDS } from './callout';
import { renderGuide } from './markdown';

const options = renderOptions();

describe('callouts', () => {
  it('renders every kind GitHub understands, each with its own label', () => {
    for (const kind of CALLOUT_KINDS) {
      const { html } = renderGuide(
        `> [!${kind.toUpperCase()}]\n> Mind this.`,
        options,
      );

      expect(html, `${kind} did not render as a callout`).toContain(
        `callout--${kind}`,
      );
      expect(html).toContain(`<span>${LABELS[kind]}</span>`);
      expect(html).toContain('Mind this.');
    }
  });

  it('renders markdown inside the body, not raw text', () => {
    const { html } = renderGuide(
      '> [!TIP]\n> Use `dispatchAsync` and [read on](/guide/managers).',
      options,
    );

    expect(html).toContain('<code>dispatchAsync</code>');
    expect(html).toContain('href="/guide/managers"');
  });

  it('leaves an ordinary blockquote alone', () => {
    const { html } = renderGuide('> Just a quote.', options);

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('callout');
  });

  it('stops at the end of the quoted block', () => {
    const { html } = renderGuide('> [!NOTE]\n> Inside.\n\nOutside.', options);

    // "Outside." is a sibling paragraph, not part of the callout body.
    expect(html).toMatch(/callout__body"><p>Inside\.<\/p>\s*<\/div><\/aside>/);
    expect(html).toContain('<p>Outside.</p>');
  });
});

describe('code fences', () => {
  it('shows the file a snippet belongs in, when the fence names one', () => {
    const { html } = renderGuide(
      '```typescript title="src/app/auth.state.ts"\nconst a = 1;\n```',
      options,
    );

    expect(html).toContain('class="code-block__title"');
    expect(html).toContain('src/app/auth.state.ts');
    expect(html).toContain('class="language-typescript"');
  });

  it('falls back to naming the language when there is no title', () => {
    const { html } = renderGuide('```typescript\nconst a = 1;\n```', options);

    expect(html).toContain('class="code-block__language"');
    expect(html).not.toContain('code-block__title');
  });
});
