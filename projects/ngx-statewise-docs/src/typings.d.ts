/**
 * The guide is authored as markdown and inlined as a string at build time by
 * the `loader` entry of the docs build target (`{ ".md": "text" }`). Declaring
 * the module here is what tells TypeScript the import is a string.
 */
declare module '*.md' {
  const content: string;
  export default content;
}
