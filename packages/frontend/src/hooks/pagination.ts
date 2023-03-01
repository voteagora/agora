import { Virtualizer } from "@tanstack/react-virtual";

export type PaginationItemType<T> =
  | {
      type: "LOADING";
    }
  | {
      type: "LOAD_MORE_SENTINEL";
    }
  | {
      type: "ITEMS";
      items: T;
    };

export function makePaginationItems<T>(
  items: ReadonlyArray<T>,
  isLoadingNext: boolean,
  hasNext: boolean
): PaginationItemType<T>[] {
  return [
    ...items.map((items) => ({
      type: "ITEMS" as const,
      items,
    })),
    ...(() => {
      if (isLoadingNext) {
        return [{ type: "LOADING" as const }];
      }

      if (hasNext) {
        return [
          {
            type: "LOAD_MORE_SENTINEL" as const,
          },
        ];
      } else {
        return [];
      }
    })(),
  ];
}

export function isLastDisplayedItemLoadMoreSentinel<T>(
  instance: Virtualizer<any, Element>,
  items: PaginationItemType<T>[]
) {
  const virtualItems = instance.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];

  if (!lastItem) {
    return;
  }

  const item = items[lastItem.index];
  if (!item) {
    return;
  }

  return item.type === "LOAD_MORE_SENTINEL";
}
