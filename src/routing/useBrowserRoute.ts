import { useCallback, useEffect, useState } from 'react';

import { parseRoute, type ParsedRoute } from '@/routing/routes';

export interface BrowserRouteState {
  pathname: string;
  parsed: ParsedRoute;
}

function currentPath(): string {
  return `${window.location.pathname}`;
}

export function useBrowserRoute() {
  const [state, setState] = useState<BrowserRouteState>(() => {
    const pathname = currentPath();
    return {
      pathname,
      parsed: parseRoute(pathname),
    };
  });

  useEffect(() => {
    const onPopState = () => {
      const pathname = currentPath();
      setState({ pathname, parsed: parseRoute(pathname) });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((pathname: string, replace = false) => {
    if (window.location.pathname === pathname) {
      setState({ pathname, parsed: parseRoute(pathname) });
      return;
    }

    if (replace) {
      window.history.replaceState({}, '', pathname);
    } else {
      window.history.pushState({}, '', pathname);
    }

    setState({ pathname, parsed: parseRoute(pathname) });
  }, []);

  return {
    ...state,
    navigate,
  };
}
