import { StorageInterface, StorageInterfaceLeaf } from "./storageInterface";

class FailableStorageLeaf implements StorageInterfaceLeaf {
  private readonly _underlyingStorage: StorageInterfaceLeaf;

  private failing: boolean = false;

  public markFailing(failing: boolean = true) {
    this.failing = failing;
  }

  constructor(storage: StorageInterfaceLeaf) {
    this._underlyingStorage = storage;
  }

  private get underlyingStorage(): StorageInterfaceLeaf {
    if (this.failing) {
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
