import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";

/**
 * Chrome/Android install prompt. The `beforeinstallprompt` event must be
 * captured (and `preventDefault`ed) early so it can be replayed later when
 * the user clicks our "Install app" button.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function useInstallPrompt(): {
  canInstall: boolean;
  install: () => Promise<void>;
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      notifications.show({ message: "App installed.", color: "teal" });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return {
    canInstall: !!deferred,
    install: async () => {
      if (!deferred) return;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        notifications.show({ message: "App installed.", color: "teal" });
      }
      setDeferred(null);
    },
  };
}

/**
 * Warm the SW cache with every image/PDF in the bundle so the app continues
 * to work in airplane mode. The SW from vite-plugin-pwa uses workbox, which
 * exposes `caches.open()` — so we just fetch each URL with a no-cors mode
 * and let the runtime caching strategy pick it up.
 */
export async function precacheAssets(urls: string[]): Promise<void> {
  const total = urls.length;
  if (total === 0) return;

  const id = notifications.show({
    title: "Saving offline…",
    message: `Downloading ${total} assets`,
    loading: true,
    autoClose: false,
    withCloseButton: false,
  });

  let done = 0;
  const CONCURRENCY = 6;
  const queue = urls.slice();

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      if (!url) break;
      try {
        // no-cors mode is what the old sw.js used — lets us store opaque
        // responses for third-party images that lack CORS headers.
        await fetch(url, { mode: "no-cors" });
      } catch {
        // Individual failures are fine — the SW runtime cache is best-effort.
      }
      done += 1;
      if (done % 10 === 0 || done === total) {
        const pct = Math.round((done / total) * 100);
        notifications.update({
          id,
          message: `Caching ${done}/${total} (${pct}%)`,
          loading: true,
          autoClose: false,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  notifications.update({
    id,
    title: "Offline-ready",
    message: `Cached ${total} assets. Works in airplane mode now.`,
    color: "teal",
    loading: false,
    autoClose: 3000,
    withCloseButton: true,
  });
}
