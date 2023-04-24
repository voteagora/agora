import { StorageInterface, StorageInterfaceLeaf } from "../storageInterface";

class FailableStorageLeaf implements StorageInterfaceLeaf {
  protected readonly _underlyingStorageLeaf: StorageInterfaceLeaf;

  protected shouldFailIter: Iterator<boolean>;

  constructor(
    storage: StorageInterfaceLeaf,
    shouldFailIter: Iterator<boolean>
  ) {
    this._underlyingStorageLeaf = storage;
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

    return this._underlyingStorageLeaf;
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
  private _underlyingStorage: StorageInterface;

  constructor(
    underlyingStorage: StorageInterface,
    shouldFailIter: Iterator<boolean>
  ) {
    super(underlyingStorage, shouldFailIter);
    this._underlyingStorage = underlyingStorage;
  }
  async transaction<T>(
    closure: (txn: StorageInterfaceLeaf) => Promise<T>
  ): Promise<T> {
    return await this._underlyingStorage.transaction(async (txn) => {
      const leaf = new FailableStorageLeaf(txn, this.shouldFailIter);

      return await closure(leaf);
    });
  }
}
