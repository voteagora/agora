export interface StorageInterface extends StorageInterfaceLeaf {
  transaction<T>(
    closure: (txn: StorageInterfaceLeaf) => Promise<T>
  ): Promise<T>;
}

interface StorageInterfaceLeaf {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  list<T = unknown>(
    options?: DurableObjectListOptions
  ): Promise<Map<string, T>>;
}

export type ListEntriesArgs = {
  start?: string;
  prefix?: string;
};

export async function* listEntries<T>(
  storage: StorageInterfaceLeaf,
  args?: ListEntriesArgs
): AsyncGenerator<[string, T]> {
  const limit = 1000;

  let start = args?.start;

  while (true) {
    const values = await storage.list({
      start,
      prefix: args?.prefix,
      limit,
      allowConcurrency: true,
    });

    const entries = Array.from(values.entries());
    if (!entries.length) {
      return;
    }

    // @ts-ignore
    yield* entries;

    const [lastEntryKey] = entries[entries.length - 1];
    start = lastEntryKey;
  }
}
