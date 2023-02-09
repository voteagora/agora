import { StorageInterface, StorageInterfaceLeaf } from "./storageInterface";
import { compareBy } from "../../utils/sortUtils";
import { cloneDeep } from "lodash";

class MemoryStorageLeaf implements StorageInterfaceLeaf {
  values: Map<string, unknown>;

  getValues(): Map<string, unknown> {
    return new Map(
      Array.from(this.values.entries()).sort(compareBy(([key, _value]) => key))
    );
  }

  constructor(values: Map<string, unknown>) {
    this.values = values;
  }

  get<T = unknown>(
    key: string,
    opts?: DurableObjectGetOptions
  ): Promise<T | undefined>;
  get<T = unknown>(
    keys: string[],
    opts?: DurableObjectGetOptions
  ): Promise<Map<string, T>>;
  async get<T = unknown>(
    key: string | string[],
    opts?: DurableObjectGetOptions
  ): Promise<T | undefined | Map<string, T>> {
    if (Array.isArray(key)) {
      return new Map(
        key.flatMap<[string, T]>((key) => {
          const value = this.values.get(key) as T | undefined;
          if (!value) {
            return [];
          }

          return [[key, value as T]];
        })
      );
    } else {
      return this.values.get(key) as T | undefined;
    }
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

        if (options?.prefix && !key.startsWith(options.prefix)) {
          return false;
        }

        return true;
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
  constructor(values: Map<string, unknown> = new Map()) {
    super(values);
  }

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
