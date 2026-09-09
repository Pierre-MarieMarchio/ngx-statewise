export interface NavigationItem {
  icon: string;
  label: string;
  /** A route of this application. Exclusive with `href`. */
  route?: string;
  /** Somewhere else entirely, such as the library's own documentation. */
  href?: string;
}
