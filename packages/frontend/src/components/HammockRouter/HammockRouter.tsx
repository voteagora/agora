import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useTransition,
} from "react";
import { HomePage } from "../../pages/HomePage/HomePage";
import { DelegatePage } from "../../pages/DelegatePage/DelegatePage";
import { EditDelegatePage } from "../../pages/EditDelegatePage/EditDelegatePage";
import { matchPath, PathMatch } from "react-router-dom";

import { createBrowserHistory } from "history";

const browserHistory = createBrowserHistory();

type Route = {
  path: string;
  element: any;
};

const routes: Route[] = [
  {
    path: "/",
    element: HomePage,
  },
  {
    path: "/delegate/:delegateId",
    element: DelegatePage,
  },
  {
    path: "/create",
    element: EditDelegatePage,
  },
];

type RouteMatch = {
  match?: PathMatch;
  index: number;
  path: string;
};

const CurrentRouteContext = createContext<RouteMatch | null>(null);
const NavigateContext = createContext<
  ((nextPath: string, asTransition?: boolean) => void) | null
>(null);
const IsPendingContext = createContext<boolean | null>(null);

function findMatchingRoute(path: string, routes: Route[]) {
  for (const { route, index } of routes.map((route, index) => ({
    route,
    index,
  }))) {
    const match = matchPath(route.path, path);
    if (match) {
      return {
        index,
        match,
        path,
      };
    }
  }

  return {
    index: 0,
    path,
  };
}

type Props = {
  children: ReactNode;
};

export function HammockRouter({ children }: Props) {
  const [currentRoute, setCurrentRoute] = useState<RouteMatch>(() =>
    findMatchingRoute(browserHistory.location.pathname, routes)
  );
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (nextPath: string, asTransition: boolean = true) => {
      const configureUpdateContext = (() => {
        if (!asTransition) {
          return (callback: () => void): void => {
            callback();
          };
        }

        return startTransition;
      })();

      const matching: RouteMatch = findMatchingRoute(nextPath, routes);

      configureUpdateContext(() => {
        browserHistory.push(nextPath);
        setCurrentRoute(matching);
      });
    },
    [setCurrentRoute, startTransition]
  );

  useEffect(() => {
    return browserHistory.listen((update) => {
      if (currentRoute.path === update.location.pathname) {
        return;
      }

      startTransition(() => {
        setCurrentRoute(findMatchingRoute(update.location.pathname, routes));
      });
    });
  }, [navigate, currentRoute]);

  return (
    <CurrentRouteContext.Provider value={currentRoute}>
      <NavigateContext.Provider value={navigate}>
        <IsPendingContext.Provider value={isPending}>
          {children}
        </IsPendingContext.Provider>
      </NavigateContext.Provider>
    </CurrentRouteContext.Provider>
  );
}

export function HammockRouterContents() {
  const currentRoute = useCurrentRoute();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentRoute]);

  const Element = routes[currentRoute.index].element;
  return <Element />;
}

export function useCurrentRoute() {
  return useContext(CurrentRouteContext)!;
}

export function useNavigate() {
  return useContext(NavigateContext)!;
}

export function useIsNavigationPending() {
  return useContext(IsPendingContext)!;
}

export function useParams() {
  return useCurrentRoute().match?.params as Record<string, string>;
}

type LinkProps = {
  to: string;
  className?: string;
  children: ReactNode;
};

export function Link({ to, className, children }: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        event.preventDefault();
        navigate(to, true);
      }}
    >
      {children}
    </a>
  );
}

type NavigateProps = {
  to: string;
};

export function Navigate({ to }: NavigateProps) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);

  return null;
}
