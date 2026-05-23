"use client";

import { useCallback, useEffect, useState } from "react";

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const TURNSTILE_LOAD_TIMEOUT_MS = 4000;

function hasRenderedIframe(containerId: string) {
  if (typeof document === "undefined") {
    return false;
  }

  const container = document.getElementById(containerId);
  return Boolean(container?.querySelector('iframe[src*="challenges.cloudflare.com"]'));
}

export function useTurnstile(resetKey: string, containerId: string) {
  const [token, setToken] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const enabled = TURNSTILE_SITE_KEY.length > 0;

  const reset = useCallback(() => {
    setToken("");
    setLoadFailed(false);
    setWidgetLoaded(false);
  }, []);

  const markLoaded = useCallback(() => {
    setWidgetLoaded(true);
    setLoadFailed(false);
  }, []);

  const markFailed = useCallback(() => {
    setToken("");
    setWidgetLoaded(false);
    setLoadFailed(true);
  }, []);

  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  useEffect(() => {
    if (!enabled || loadFailed || widgetLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      markFailed();
    }, TURNSTILE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, loadFailed, widgetLoaded, markFailed, resetKey]);

  useEffect(() => {
    if (!enabled || loadFailed || token) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!hasRenderedIframe(containerId)) {
        markFailed();
      }
    }, TURNSTILE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [containerId, enabled, loadFailed, markFailed, resetKey, token]);

  return {
    siteKey: TURNSTILE_SITE_KEY,
    token,
    setToken,
    loadFailed,
    widgetLoaded,
    shouldRender: enabled && !loadFailed,
    mustSolveBeforeSubmit: enabled && widgetLoaded && !loadFailed,
    markLoaded,
    markFailed,
    reset,
  };
}
