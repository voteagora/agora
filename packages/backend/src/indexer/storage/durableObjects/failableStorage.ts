import { StorageInterface, StorageInterfaceLeaf } from "./storageInterface";

class FailableStorageLeaf implements StorageInterfaceLeaf {
  private readonly _underlyingStorage: StorageInterfaceLeaf;

  private shouldFailIter: Iterator<boolean>;

  constructor(
    storage: StorageInterfaceLeaf,
    shouldFailIter: Iterator<boolean>
  ) {
    this._underlyingStorage = storage;
    this.shouldFailIter = shouldFailIter;
  }

  private get underlyingStorage(): StorageInterfaceLeaf {
    const iterResult = this.shouldFailIter.next();
    if (iterResult.done) {
      throw new Error("shouldFailIter exhausted");
    }

    if (iterResult.value) {
      throw new Error("failing");
    }

    return this._underlyingStorage;
  }

  delete(...args: any[]) {
    // @ts-ignore
    return this.underlyingStorage.delete(...args);
  }

  get(...args: any[]) {
    // @ts-ignore
    return this.underlyingStorage.get(...args) as any;
  }

  list(...args: any[]) {
    // @ts-ignore
    return this.underlyingStorage.list(...args) as any;
  }

  put<T>(...args: any[]) {
    // @ts-ignore
    return this.underlyingStorage.put(...args) as any;
  }
}

/**
 * A proxy to an underlying StorageInterface where callers can introduce errors
 * at any point we desire.
 */
export class FailableStorage
  extends FailableStorageLeaf
  implements StorageInterface
{
  async transaction<T>(
    closure: (txn: StorageInterfaceLeaf) => Promise<T>
  ): Promise<T> {
    return await closure(this);
  }
}
