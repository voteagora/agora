import { Marshaller } from "@aws/dynamodb-auto-marshaller";

// todo: shared package for dynamo access
export const marshaller = new Marshaller({ unwrapNumbers: true });

type KeyArgs = {
  PartitionKey: string;
  SortKey: string;
};

export function makeKey(args: KeyArgs) {
  return marshaller.marshallItem({
    PartitionKey: args.PartitionKey,
    SortKey: args.SortKey,
  });
}
