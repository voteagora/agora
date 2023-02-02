type WorkloadResult<NextValue> =
  | {
      type: "REPEAT";
      value: NextValue;
    }
  | {
      type: "TERMINATE";
    };

export type YieldingWorkload<NextValue> = (
  value?: NextValue
) => Promise<WorkloadResult<NextValue>>;

export type YieldingWorkloadExecutor<NextValue> = ReturnType<
  typeof makeYieldingWorkloadExecutor<NextValue>
>;

export function makeYieldingWorkloadExecutor<NextValue>(
  storage: DurableObjectStorage,
  workload: YieldingWorkload<NextValue>
) {
  const runWorkloadOnce = async (value?: NextValue) => {
    const result = await workload(value);
    switch (result.type) {
      case "TERMINATE": {
        return;
      }

      case "REPEAT": {
        await storage.transaction(async (tx) => {
          tx.put(alarmValueKey, result.value);
          tx.setAlarm(new Date());
        });
      }
    }
  };

  return {
    async start() {
      await storage.delete(alarmValueKey);
      await runWorkloadOnce();
    },

    async execute() {
      const alarmValue = await storage.get(alarmValueKey);
      await storage.delete(alarmValueKey);
      await runWorkloadOnce(alarmValue as any);
    },
  };
}

const alarmValueKey = "alarmValue";
