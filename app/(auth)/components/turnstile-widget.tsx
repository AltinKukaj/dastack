"use client";

import { useEffect, useRef } from "react";

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  onUnavailable: () => void;
}

/**
 * Renders Cloudflare Turnstile explicitly so we don't depend on inline script callbacks.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  onUnavailable,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onUnavailableRef = useRef(onUnavailable);

  useEffect(() => {
    onTokenRef.current = onToken;
    onUnavailableRef.current = onUnavailable;
  }, [onToken, onUnavailable]);

  useEffect(() => {
    let unmounted = false;

    const renderWidget = () => {
      if (unmounted) return;
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => {
          onTokenRef.current(null);
          onUnavailableRef.current();
        },
      });
    };

    const onScriptLoad = () => {
      if (!window.turnstile) {
        onUnavailableRef.current();
        return;
      }
      renderWidget();
    };

    const onScriptError = () => {
      onUnavailableRef.current();
    };

    const existingScript = document.getElementById("turnstile-script");
    if (existingScript) {
      existingScript.addEventListener("load", onScriptLoad);
      existingScript.addEventListener("error", onScriptError);
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", onScriptLoad);
      script.addEventListener("error", onScriptError);
      document.head.appendChild(script);
    }

    return () => {
      unmounted = true;
      const script = document.getElementById("turnstile-script");
      script?.removeEventListener("load", onScriptLoad);
      script?.removeEventListener("error", onScriptError);

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
