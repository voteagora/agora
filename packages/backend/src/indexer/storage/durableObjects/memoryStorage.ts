import { StorageInterface, StorageInterfaceLeaf } from "./storageInterface";
import { compareBy } from "../../utils/sortUtils";
import { cloneDeep } from "lodash";

class MemoryStorageLeaf implements StorageInterfaceLeaf {
  values: Map<string, unknown>;

  constructor(values: Map<string, unknown>) {
    this.values = values;
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T;
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }

  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  async delete(key: string | string[]): Promise<boolean | number> {
    if (!Array.isArray(key)) {
      return this.values.delete(key);
    }

    const keys = key;
    let keysDeleted = 0;

    for (const key of keys) {
      const keyDeleted = this.values.delete(key);
      if (keyDeleted) {
        keysDeleted++;
      }
    }

    return keysDeleted;
  }

  async list<T = unknown>(
    options?: DurableObjectListOptions
  ): Promise<Map<string, T>> {
    const items = Array.from(this.values.entries())
      .sort(compareBy(([key]) => key))
      .filter(([key]) => {
        if (options?.start && !(key >= options.start)) {
          return false;
        }

        if (options?.startAfter && !(key > options.startAfter)) {
          return false;
        }

        if (options?.end && !(key < options.end)) {
          return false;
        }
      });

    const reversed = (() => {
      if (options?.reverse) {
        return items.reverse();
      } else {
        return items;
      }
    })();

    const limited = (() => {
      if (options?.limit) {
        return reversed.slice(0, options.limit);
      } else {
        return reversed;
      }
    })();

    return new Map<string, unknown>(limited) as Map<string, T>;
  }
}

/**
 * A very inefficient implementation of StorageInterface for testing.
 */
export class MemoryStorage
  extends MemoryStorageLeaf
  implements StorageInterface
{
  async transaction<T>(
    closure: (txn: StorageInterfaceLeaf) => Promise<T>
  ): Promise<T> {
    const leaf = this.makeLeaf();

    const result = await closure(leaf);

    this.values = leaf.values;

    return result;
  }

  private makeLeaf(): MemoryStorageLeaf {
    return new MemoryStorageLeaf(
      new Map(
        Array.from(this.values.entries()).map(([key, value]) => [
          key,
          cloneDeep(value),
        ])
      )
    );
  }
}
