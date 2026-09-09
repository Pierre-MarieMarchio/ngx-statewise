/**
 * The floor: an Angular application that does not import ngx-statewise at all.
 *
 * Everything the other two variants weigh is measured against this, so what
 * the script reports is the library's own cost rather than Angular's.
 */
export function subject(): string {
  return 'no ngx-statewise';
}
