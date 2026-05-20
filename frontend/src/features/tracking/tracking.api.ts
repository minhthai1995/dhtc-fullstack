import { getSessionId, getVisitorId } from "./visitor";

export interface PageViewPayload {
  path: string;
  referrer?: string | null;
}

export function sendPageView({ path, referrer }: PageViewPayload): void {
  const body = JSON.stringify({
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    path,
    referrer: referrer ?? document.referrer ?? null,
  });
  const token = sessionStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  fetch("/api/v1/tracking/page-view", {
    method: "POST",
    headers,
    body,
    keepalive: true,
  }).catch(() => {
    /* fire-and-forget; tracking failures must never break UX */
  });
}
