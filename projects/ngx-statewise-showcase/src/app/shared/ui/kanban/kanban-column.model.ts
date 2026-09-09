/** One column of a board, and what it holds. */
export interface KanbanColumn<Item> {
  readonly id: string;
  readonly label: string;
  readonly items: readonly Item[];
}

/** An item that changed column, by drag or by keyboard. */
export interface KanbanMove<Item> {
  readonly item: Item;
  readonly from: string;
  readonly to: string;
}

/** The items of one column, in the order they were just put in. */
export interface KanbanReorder<Item> {
  readonly columnId: string;
  readonly items: readonly Item[];
}
