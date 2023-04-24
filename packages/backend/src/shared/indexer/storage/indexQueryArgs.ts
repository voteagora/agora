import {
  IndexKeyType,
  makeIndexPrefix,
  serializeIndexKey,
} from "./keys/indexKey";

export type IndexQueryArgs = {
  prefix?: IndexKeyType;
  starting?: IndexKeyType;
};

export function exactIndexValue(indexKey: string): IndexQueryArgs {
  return {
    prefix: {
      indexKey,
    },
    starting: {
      indexKey,
    },
  };
}

export function resolveIndexQueryArgs(
  entity: string,
  indexName: string,
  args: IndexQueryArgs
) {
  const indexKeyPrefix = makeIndexPrefix(entity, indexName);

  return {
    startingKey:
      indexKeyPrefix +
      (!!args.starting ? serializeIndexKey(args.starting) : ""),
    indexPrefix:
      indexKeyPrefix + (!!args.prefix ? serializeIndexKey(args.prefix) : ""),
  };
}
