import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getSessionId, getVisitorId } from "@/features/tracking/visitor";

const SESSION_IDLE_MS = 30 * 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("getVisitorId", () => {
  it("persists across calls and survives reload", () => {
    const first = getVisitorId();
    expect(first).toMatch(/.{8,}/);
    expect(localStorage.getItem("dhtc_visitor_id")).toBe(first);

    const second = getVisitorId();
    expect(second).toBe(first);
  });

  it("issues a new id when localStorage is cleared", () => {
    const first = getVisitorId();
    localStorage.clear();
    const second = getVisitorId();
    expect(second).not.toBe(first);
  });
});

describe("getSessionId", () => {
  it("returns the same id within the idle window", () => {
    const t0 = 1_000_000_000_000;
    const first = getSessionId(t0);
    const second = getSessionId(t0 + 5 * 60 * 1000);
    expect(second).toBe(first);
  });

  it("rotates after 30 minutes of inactivity", () => {
    const t0 = 1_000_000_000_000;
    const first = getSessionId(t0);
    const second = getSessionId(t0 + SESSION_IDLE_MS + 1);
    expect(second).not.toBe(first);
    expect(sessionStorage.getItem("dhtc_session_id")).toBe(second);
  });

  it("starts a new session when sessionStorage is empty", () => {
    const t0 = 1_000_000_000_000;
    const first = getSessionId(t0);
    sessionStorage.clear();
    const second = getSessionId(t0 + 1);
    expect(second).not.toBe(first);
  });
});
