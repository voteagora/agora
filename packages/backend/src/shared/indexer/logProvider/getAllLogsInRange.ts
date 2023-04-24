import { LogProvider, TopicFilter } from "./logProvider";
import {
  defaultPageSizeCalculator,
  PageSizeCalculator,
} from "./pageSizeCalculator";

export async function* getAllLogsInRange(
  provider: LogProvider,
  filter: TopicFilter,
  fromBlockInclusive: number,
  toBlockInclusive: number,
  pageSizeCalculator: PageSizeCalculator = defaultPageSizeCalculator()
) {
  let startBlock = fromBlockInclusive;

  while (startBlock <= toBlockInclusive) {
    try {
      const pageSize = pageSizeCalculator.getPageSize();

      const toBlock = Math.min(startBlock + pageSize, toBlockInclusive);

      const logs = await provider.getLogs({
        fromBlock: startBlock,
        toBlock,
        ...filter,
      });

      pageSizeCalculator.recordSuccess();

      yield {
        fromBlock: startBlock,
        toBlock,
        logs,
      };

      startBlock = toBlock + 1;
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }

      if (!e.message.includes("response size exceeded")) {
        throw e;
      }

      pageSizeCalculator.recordFailure();
    }
  }
}
