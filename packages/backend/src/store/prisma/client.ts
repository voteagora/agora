import { PrismaClient } from "@prisma/client/edge";

class PrismaSingleton {
  private static prismaInstance: any;
  private static connectionUrl: string | undefined;

  private constructor() {}

  public static setConnectionUrl(connectionUrl: string): void {
    if (!PrismaSingleton.connectionUrl)
      PrismaSingleton.connectionUrl = connectionUrl;
  }

  public static get instance(): PrismaClient {
    if (!PrismaSingleton.prismaInstance) {
      if (!PrismaSingleton.connectionUrl) {
        throw new Error("DATABASE_URL is not set");
      }

      PrismaSingleton.prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: this.connectionUrl,
          },
        },
      });
    }

    return PrismaSingleton.prismaInstance;
  }

  public static get isConnected(): boolean {
    return !!PrismaSingleton.prismaInstance;
  }

  public static get getConnectionUrl(): string | undefined {
    return PrismaSingleton.connectionUrl;
  }

  public static get isInstanceConnected(): boolean {
    return !!PrismaSingleton.prismaInstance?.$connect;
  }
}

export default PrismaSingleton;
