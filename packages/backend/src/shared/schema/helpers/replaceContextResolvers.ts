import { GraphQLResolveInfo } from "graphql";

export type ReplaceContextAllResolvers<
  AllResolversType extends Record<string, any>,
  ContextType
> = {
  [K in keyof AllResolversType]: AllResolversType[K] extends undefined
    ? undefined
    : ReplaceContextResolvers<AllResolversType[K], ContextType>;
};

/**
 * Replace the context type of all field resolvers for a type.
 */
export type ReplaceContextResolvers<
  ResolversType extends Record<string, any>,
  ContextType
> = {
  [K in keyof ResolversType]: ResolversType[K] extends
    | Resolver<any, any, any, any>
    | undefined
    ? ReplaceContextFieldResolver<ResolversType[K], ContextType>
    : ResolversType[K];
};

/**
 * Replace the context type of a single field resolver.
 */
type ReplaceContextFieldResolver<
  ResolverType extends Resolver<any, any, any, any> | undefined,
  ContextType
> = ResolverType extends undefined
  ? undefined
  : ResolverType extends Resolver<
      infer TResult,
      infer TParent,
      infer TContext,
      infer TArgs
    >
  ? Resolver<TResult, TParent, ContextType, TArgs>
  : never;

type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;
