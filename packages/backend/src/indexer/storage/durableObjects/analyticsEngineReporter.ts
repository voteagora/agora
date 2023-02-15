import { StorageInterface, StorageInterfaceLeaf } from "./storageInterface";
import { AnalyticsEngineDataset } from "@cloudflare/workers-types";
import { getOrInsert } from "../../utils/mapUtils";

class AnalyticsEngineReporterLeaf implements StorageInterfaceLeaf {
  protected readonly analyticsEngineDataset: AnalyticsEngineDataset;
  private readonly underlyingStorage: StorageInterfaceLeaf;
  readonly pendingBlobs: Map<string, { blobs: string[]; count: number }>;

  constructor(
    underlyingStorage: StorageInterfaceLeaf,
    analyticsEngineDataset: AnalyticsEngineDataset,
    pendingBlobs: Map<string, { blobs: string[]; count: number }>
  ) {
    this.underlyingStorage = underlyingStorage;
    this.analyticsEngineDataset = analyticsEngineDataset;
    this.pendingBlobs = pendingBlobs;
  }

  protected trackEvent(blobs: string[]) {
    const key = blobs.join("!");

    const value = getOrInsert(this.pendingBlobs, key, () => ({
      blobs: blobs,
      count: 0,
    }));

    value.count++;
  }

  public flushIoReport(staticBlobs: string[]) {
    try {
      for (const { blobs, count } of this.pendingBlobs.values()) {
        this.analyticsEngineDataset.writeDataPoint({
          blobs: [...blobs, ...staticBlobs],
          doubles: [count],
        });
      }
    } finally {
      this.pendingBlobs.clear();
    }
  }

  protected async executeWithTracking<T>(
    operationName: string,
    closure: () => Promise<T>
  ): Promise<T> {
    try {
      this.trackEvent([`operation:${operationName}`, "status:start"]);

      const result = await closure();

      this.trackEvent([`operation:${operationName}`, "status:finish"]);

      return result;
    } catch (e) {
      this.trackEvent([`operation:${operationName}`, "status:error"]);

      throw e;
    }
  }

  delete(...args: any[]) {
    return this.executeWithTracking("delete", () =>
      // @ts-ignore
      this.underlyingStorage.delete(...args)
    ) as any;
  }

  get(...args: any[]) {
    return this.executeWithTracking("get", () =>
      // @ts-ignore
      this.underlyingStorage.get(...args)
    ) as any;
  }

  list(...args: any[]) {
    return this.executeWithTracking("list", () =>
      // @ts-ignore
      this.underlyingStorage.list(...args)
    ) as any;
  }

  put<T>(...args: any[]) {
    return this.executeWithTracking("put", () =>
      // @ts-ignore
      this.underlyingStorage.put(...args)
    ) as any;
  }
}

/**
 * Wraps a StorageInterface recording reads and writes to Cloudflare's Analytics
 * Engine. Holds all writes in memory until flushed with flushIoReport is called.
 */
export class AnalyticsEngineReporter
  extends AnalyticsEngineReporterLeaf
  implements StorageInterface
{
  private readonly _underlyingStorage: StorageInterface;

  constructor(
    underlyingStorage: StorageInterface,
    analyticsEngineDataset: AnalyticsEngineDataset
  ) {
    const pendingBlobs = new Map<string, { blobs: string[]; count: number }>();
    super(underlyingStorage, analyticsEngineDataset, pendingBlobs);

    this._underlyingStorage = underlyingStorage;
  }

  async transaction<T>(
    closure: (txn: StorageInterfaceLeaf) => Promise<T>
  ): Promise<T> {
    return await this.executeWithTracking(
      "txn",
      async () =>
        await this._underlyingStorage.transaction(async (txn) => {
          const leaf = new AnalyticsEngineReporterLeaf(
            txn,
            this.analyticsEngineDataset,
            this.pendingBlobs
          );
          return await closure(leaf);
        })
    );
  }
}
