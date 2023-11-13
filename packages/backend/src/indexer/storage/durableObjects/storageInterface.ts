export interface StorageInterface extends StorageInterfaceLeaf {
  transaction<T>(
    closure: (txn: StorageInterfaceLeaf) => Promise<T>
  ): Promise<T>;
}

export interface StorageInterfaceLeaf {
  get<T = unknown>(
    key: string,
    opts?: DurableObjectGetOptions
  ): Promise<T | undefined>;
  get<T = unknown>(
    keys: string[],
    opts?: DurableObjectGetOptions
  ): Promise<Map<string, T>>;
  put<T>(key: string, value: T, opts?: DurableObjectPutOptions): Promise<void>;
  delete(key: string, opts?: DurableObjectPutOptions): Promise<boolean>;
  delete(keys: string[], opts?: DurableObjectPutOptions): Promise<number>;
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

  const initialStartValue = args?.start;
  let start = initialStartValue;

  while (true) {
    const values = await storage.list({
      start,
      prefix: args?.prefix,
      limit,
      allowConcurrency: true,
      noCache: true,
    });

    const entries = Array.from(values.entries()).slice(
      start === initialStartValue ? 0 : 1
    );

    if (!entries.length) {
      return;
    }

    // @ts-ignore
    yield* entries;

    start = entries[entries.length - 1][0];

    if (start === initialStartValue) {
      return;
    }
  }
}
