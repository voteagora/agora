import { ethers } from "ethers";

import { trace } from "../../workers/datadogTracer/contextSpan";
import { flattenMetaInputType } from "../../workers/datadogTracer/flatten";

import { LogFilter, LogProvider } from "./logProvider";

const name = "LogProvider";

/**
 * LogProvider wrapping all operations with tracing.
 */
export class TracingLogProvider implements LogProvider {
  constructor(private readonly logProvider: LogProvider) {}

  async getLogs(filter: LogFilter): Promise<ethers.providers.Log[]> {
    return trace(
      {
        name,
        resource: "LogProvider.getLogs",
        meta: flattenMetaInputType({
          args: {
            filter,
          },
        }),
      },
      () => this.logProvider.getLogs(filter)
    );
  }
}
