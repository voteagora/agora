import { createBrowserHistory, History } from "history";
import { isEqual } from "lodash";
import {
  createContext,
  ReactNode,
  TransitionStartFunction,
  useCallback,
  useContext,
  useLayoutEffect,
  useTransition,
} from "react";
import { matchPath, PathMatch } from "react-router-dom";
import {
  atom,
  selector,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
} from "recoil";

import { DelegatePage } from "../../pages/DelegatePage/DelegatePage";
import { EditDelegatePage } from "../../pages/EditDelegatePage/EditDelegatePage";
import { HomePage } from "../../pages/HomePage/HomePage";
import { OopsPage } from "../../pages/OopsPage/OopsPage";
import { PropHouseAuctionPage } from "../../pages/PropHouseAuctionPage/PropHouseAuctionPage";
import { ProposalsListPage } from "../../pages/ProposalsListPage/ProposalsListPage";
import { ProposalsPage } from "../../pages/ProposalsPage/ProposalsPage";
import { VoteAuctionPage } from "../../pages/VoteAuctionPage/VoteAuctionPage";

export const browserHistory = createBrowserHistory();

type Route = {
  path: string;
  element: any;
};

const routes: Route[] = [
  {
    path: "/oops",
    element: OopsPage,
  },
  {
    path: "/",
    element: ProposalsListPage,
  },
  {
    path: "/voters",
    element: HomePage,
  },
  {
    path: "/delegate/:delegateId",
    element: DelegatePage,
  },
  {
    path: "/voteauction",
    element: VoteAuctionPage,
  },
  {
    path: "/create",
    element: EditDelegatePage,
  },
  {
    path: "/proposals",
    element: ProposalsListPage,
  },
  {
    path: "/proposals/:proposalId",
    element: ProposalsPage,
  },
  {
    path: "/auctions/:auctionId",
    element: PropHouseAuctionPage,
  },
];

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

function routingStateForLocation(location: Location): RoutingState {
  return {
    match: findMatchingRoute(location.pathname, routes),
    location,
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

// We use recoil here because recoil is able to schedule updates to an external
// store (browserHistory) AFTER the updated state has been committed.
const routingStateAtom = atom<RoutingState>({
  key: "RoutingState",
  default: selector({
    key: "RoutingStateInitializer",
    get() {
      return routingStateForLocation(
        locationFromHistoryLocation(browserHistory.location)
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
          routingStateForLocation(locationFromHistoryLocation(update.location))
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
            return routingStateForLocation(nextLocation);
          });

          afterUpdate();
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

  const Element = routes[currentRoute.match.index].element;
  return <Element />;
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
