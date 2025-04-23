import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class EffectRelationRegistery {
  private readonly actionRelations: Map<string, Set<string>> = new Map();

  public registerRelation(parent: string, child: string): void {
    if (!this.actionRelations.has(parent)) {
      this.actionRelations.set(parent, new Set());
    }
    this.actionRelations.get(parent)?.add(child);
  }

  public getAllRelated(
    action: string,
    visited = new Set<string>()
  ): Set<string> {
    if (visited.has(action)) return visited;
    visited.add(action);

    const children = this.actionRelations.get(action) || new Set();
    for (const child of children) {
      this.getAllRelated(child, visited);
    }
    return visited;
  }
}
