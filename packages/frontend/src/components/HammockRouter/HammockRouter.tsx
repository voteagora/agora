import React, {
  ComponentType,
  createContext,
  ReactNode,
  TransitionStartFunction,
  useCallback,
  useContext,
  useLayoutEffect,
  useTransition,
} from "react";
import { matchPath, PathMatch } from "react-router-dom";
import { createBrowserHistory, History } from "history";
import {
  atom,
  selector,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
} from "recoil";
import { isEqual } from "lodash";
import { Environment, GraphQLTaggedNode, OperationType } from "relay-runtime";
import { loadQuery, useRelayEnvironment } from "react-relay";
import { PreloadedQuery } from "react-relay/hooks";
import { relayEnvironment } from "../../relayEnvironment";
import { routes } from "./routes";

export const browserHistory = createBrowserHistory();

export type RouteProps<QueryType extends OperationType> = {
  initialQueryRef: PreloadedQuery<QueryType>;
  variables: QueryType["variables"];
};

export type Route = {
  path: string;
  params: RouteLoadingParams<any>;
};

export type RouteLoadingParams<QueryType extends OperationType> = {
  element: ComponentType<RouteProps<QueryType>>;
  query?: GraphQLTaggedNode;
  variablesFromLocation?: (
    location: Location,
    pathMatch: PathMatch
  ) => QueryType["variables"];
};

type RouteMatch = {
  match?: PathMatch;
  index: number;
};

export type Location = {
  pathname: string;
  search: Record<string, string>;
};

type RoutingState = {
  location: Location;
  match: RouteMatch;
  preloadState?: PreloadState<any>;
};

export type PreloadState<QueryType extends OperationType> = {
  variables: QueryType["variables"];
  initialQueryRef: PreloadedQuery<QueryType>;
};

type NavigateUpdate = {
  path?: string;
  search?: Record<string, string | null>;
};

const NavigateContext = createContext<
  | ((
      update: NavigateUpdate,
      asTransition?: boolean,
      afterUpdate?: () => void
    ) => void)
  | null
>(null);
const IsPendingContext = createContext<boolean | null>(null);
const StartTransitionContext = createContext<TransitionStartFunction | null>(
  null
);

function findMatchingRoute(path: string, routes: Route[]): RouteMatch {
  for (const { route, index } of routes.map((route, index) => ({
    route,
    index,
  }))) {
    const match = matchPath(route.path, path);
    if (match) {
      return {
        index,
        match,
      };
    }
  }

  return {
    index: 0,
  };
}

type Props = {
  children: ReactNode;
};

function locationFromHistoryLocation(location: History["location"]): Location {
  return {
    pathname: location.pathname,
    search: Object.fromEntries(new URLSearchParams(location.search).entries()),
  };
}

function routingStateForLocation(
  location: Location,
  relayEnvironment: Environment
): RoutingState {
  const match = findMatchingRoute(location.pathname, routes);
  const params = routes[match.index].params;

  return {
    match,
    location,
    preloadState: (() => {
      if (params.query && relayEnvironment && match.match) {
        const variables =
          params?.variablesFromLocation?.(location, match.match) ?? {};

        const initialQueryRef = loadQuery(
          relayEnvironment,
          params.query,
          variables
        );

        return {
          initialQueryRef,
          variables,
        };
      }
    })(),
  };
}

function serializedPathFromLocation(location: Location): string {
  const searchSerialized = new URLSearchParams(location.search).toString();

  return `${location.pathname}${
    !!searchSerialized ? "?" + searchSerialized : ""
  }`;
}

function mergeUpdateWithPreviousValue(
  previousLocation: Location,
  update: NavigateUpdate
): Location {
  return {
    search: update.search
      ? Object.fromEntries(
          Object.entries({
            ...previousLocation.search,
            ...update.search,
          })
            .map(([key, value]) => ({ key, value }))
            .flatMap(({ key, value }) => {
              if (!value) {
                return [];
              }

              return [{ key, value }];
            })
            .map(({ key, value }) => [key, value])
        )
      : {},
    pathname: update.path ?? previousLocation.pathname,
  };
}

const mutabilityOptions = {
  // Allow mutability to ensure loadQuery can complete.
  dangerouslyAllowMutability: true,
};

// We use recoil here because recoil is able to schedule updates to an external
// store (browserHistory) AFTER the updated state has been committed.
const routingStateAtom = atom<RoutingState>({
  key: "RoutingState",

  ...mutabilityOptions,
  default: selector({
    key: "RoutingStateInitializer",
    ...mutabilityOptions,
    get() {
      return routingStateForLocation(
        locationFromHistoryLocation(browserHistory.location),
        relayEnvironment
      );
    },
  }),
  effects: [
    ({ onSet, setSelf }) => {
      onSet((updatedRoutingState) => {
        const nextLocation = updatedRoutingState.location;
        const currentLocation = locationFromHistoryLocation(
          browserHistory.location
        );

        if (isEqual(nextLocation, currentLocation)) {
          return;
        }

        browserHistory.push(serializedPathFromLocation(nextLocation));
      });
      return browserHistory.listen((update) =>
        setSelf(
          routingStateForLocation(
            locationFromHistoryLocation(update.location),
            relayEnvironment
          )
        )
      );
    },
  ],
});

export class BlockNavigationError extends Error {}

export function HammockRouter({ children }: Props) {
  const [currentRoute, setCurrentRoute] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(routingStateAtom);
  const [isPending, startTransition] = useTransition();

  const relayEnvironment = useRelayEnvironment();

  const navigate = useCallback(
    (
      update: NavigateUpdate,
      asTransition: boolean = true,
      afterUpdate = () => {}
    ) => {
      const configureUpdateContext = (() => {
        if (!asTransition) {
          return (callback: () => void): void => {
            callback();
          };
        }

        return startTransition;
      })();

      configureUpdateContext(() => {
        try {
          browserHistory.push(
            serializedPathFromLocation(
              mergeUpdateWithPreviousValue(currentRoute.location, update)
            )
          );

          setCurrentRoute((previousValue) => {
            const nextLocation = mergeUpdateWithPreviousValue(
              previousValue.location,
              update
            );
            return routingStateForLocation(nextLocation, relayEnvironment);
          });

          afterUpdate?.();
        } catch (e) {
          if (e instanceof BlockNavigationError) {
            return;
          } else {
            throw e;
          }
        }
      });
    },
    [setCurrentRoute, currentRoute, startTransition]
  );

  return (
    <NavigateContext.Provider value={navigate}>
      <IsPendingContext.Provider value={isPending}>
        <StartTransitionContext.Provider value={startTransition}>
          {children}
        </StartTransitionContext.Provider>
      </IsPendingContext.Provider>
    </NavigateContext.Provider>
  );
}

export function HammockRouterContents() {
  const currentRoute =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(routingStateAtom);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentRoute.location.pathname]);

  const Element = routes[currentRoute.match.index].params.element;
  return (
    <Element
      initialQueryRef={currentRoute.preloadState?.initialQueryRef as any}
      variables={currentRoute.preloadState?.variables as any}
    />
  );
}

export function useNavigate() {
  return useContext(NavigateContext)!;
}

export function useIsNavigationPending() {
  return useContext(IsPendingContext)!;
}

export function useStartTransition() {
  return useContext(StartTransitionContext)!;
}

export function useLocation(): Location {
  return useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(routingStateAtom).location;
}

export function useParams() {
  return useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(routingStateAtom).match
    ?.match?.params as Record<string, string>;
}
