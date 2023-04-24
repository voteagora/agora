export function makeContainer<DefTypes extends Record<string, any>>(
  makeDefs: (
    factory: <
      Defs extends ReadonlyArray<keyof DefTypes & string>,
      Result extends any
    >(
      dep: DependencyDefinition<DefTypes, Defs, Result>
    ) => DependencyDefinition<DefTypes, Defs, Result>
  ) => {
    [K in keyof DefTypes]: DependencyDefinition<DefTypes, any, DefTypes[K]>;
  }
): DIContainer<DefTypes> {
  const defs = makeDefs((deps) => deps);
  const valueCache = new Map<keyof DefTypes, Promise<any>>();

  const value = {
    async getValue<K extends keyof DefTypes>(
      injectionKey: K
    ): Promise<DefTypes[K]> {
      const fromCache = valueCache.get(injectionKey);
      if (fromCache) {
        return await fromCache;
      }

      const promise = (async () => {
        const def: DependencyDefinition<
          DefTypes,
          ReadonlyArray<keyof DefTypes & string>,
          any
        > = defs[injectionKey];
        const deps = await Promise.all(
          def.dependencies.map((dep) => value.getValue(dep))
        );

        return await def.create(...deps);
      })();

      valueCache.set(injectionKey, promise);

      return await promise;
    },
  };

  return value;
}

export type DIContainer<DefTypes extends Record<string, any>> = {
  getValue<K extends keyof DefTypes>(injectionKey: K): Promise<DefTypes[K]>;
};

export function provideInstance<T>(value: T): DependencyDefinition<any, [], T> {
  return {
    dependencies: [],
    create() {
      return value;
    },
  };
}

function makeDependencyDefinition<
  DefTypes extends Record<string, any>,
  Deps extends ReadonlyArray<keyof DefTypes & string>,
  Result extends any
>(
  definition: DependencyDefinition<DefTypes, Deps, Result>
): DependencyDefinition<DefTypes, Deps, Result> {
  return definition;
}

export function makeDependencyDefinitionFactory<
  DefTypes extends Record<string, any>
>(): <Deps extends ReadonlyArray<keyof DefTypes & string>, Result extends any>(
  def: DependencyDefinition<DefTypes, Deps, Result>
) => DependencyDefinition<DefTypes, Deps, Result> {
  return makeDependencyDefinition;
}

type DependencyDefinition<
  DefTypes extends Record<string, any>,
  Deps extends ReadonlyArray<keyof DefTypes & string>,
  Result extends any
> = {
  readonly dependencies: Deps;
  create(
    ...args: {
      [K in keyof Deps]: DefTypes[Deps[K]];
    }
  ): Promise<Result> | Result;
};
