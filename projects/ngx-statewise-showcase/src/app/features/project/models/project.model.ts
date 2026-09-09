/**
 * The five the stylesheet knows.
 *
 * `[class]="'tag-' + project.color"` builds a class name out of this, and
 * `_accordion.scss` defines exactly these five. A plain `string` let a sixth
 * render unstyled and in silence — harmless while the only projects came from
 * a fixture, reachable the moment one can be created.
 */
export type ProjectColor = 'orange' | 'green' | 'blue' | 'purple' | 'pink';

export const PROJECT_COLORS = [
  'orange',
  'green',
  'blue',
  'purple',
  'pink',
] as const;

export interface Project {
  id: string;
  title: string;
  color: ProjectColor;
}

/**
 * A project on its way to the server, which is what the client can know of
 * one: `id` is the server's to mint.
 */
export interface ProjectDraft {
  readonly title: string;
  readonly color: ProjectColor;
}
