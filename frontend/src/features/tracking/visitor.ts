const VISITOR_KEY = "dhtc_visitor_id";
const SESSION_KEY = "dhtc_session_id";
const SESSION_LAST_SEEN_KEY = "dhtc_session_last_seen";
const SESSION_IDLE_MS = 30 * 60 * 1000;

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId(now: number = Date.now()): string {
  const lastSeenRaw = sessionStorage.getItem(SESSION_LAST_SEEN_KEY);
  const lastSeen = lastSeenRaw ? Number.parseInt(lastSeenRaw, 10) : 0;
  const stored = sessionStorage.getItem(SESSION_KEY);
  const expired = !stored || !lastSeen || now - lastSeen > SESSION_IDLE_MS;
  const id = expired ? generateId() : stored!;
  sessionStorage.setItem(SESSION_KEY, id);
  sessionStorage.setItem(SESSION_LAST_SEEN_KEY, String(now));
  return id;
}
