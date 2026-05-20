import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { sendPageView } from "./tracking.api";

export function useTracking(): void {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (previousPath.current === path) return;
    previousPath.current = path;
    sendPageView({ path });
  }, [location.pathname, location.search]);
}
