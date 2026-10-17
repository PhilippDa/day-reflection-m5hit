import { signal, type ReadonlySignal } from "@preact/signals";

export interface UpdateHandle {
  /** A new version has been downloaded and waits for the user to switch. */
  readonly available: ReadonlySignal<boolean>;
  /** Activates the waiting version and reloads the page. */
  readonly apply: () => void;
}

/**
 * Registers the service worker (relative path, so it works under /<repo>/). A new version is
 * never activated behind the user's back: it waits until `apply` is called.
 */
export function registerServiceWorker(): UpdateHandle {
  const available = signal(false);
  let waiting: ServiceWorker | null = null;

  const handle: UpdateHandle = {
    available,
    apply() {
      if (!waiting) {
        return;
      }
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          location.reload();
        },
        { once: true },
      );
      // ServiceWorker.postMessage has no targetOrigin parameter, unlike window.postMessage.
      // oxlint-disable-next-line unicorn/require-post-message-target-origin
      waiting.postMessage({ type: "SKIP_WAITING" });
    },
  };

  if (!("serviceWorker" in navigator)) {
    return handle;
  }

  const markWaiting = (worker: ServiceWorker | null): void => {
    // Without a controller this is the very first install: nothing to update.
    if (worker && navigator.serviceWorker.controller) {
      waiting = worker;
      available.value = true;
    }
  };

  void navigator.serviceWorker
    .register("./sw.js")
    .then((registration) => {
      markWaiting(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed") {
            markWaiting(installing);
          }
        });
      });
      // A Home Screen app can stay open for days, so look for a new version when it comes back.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void registration.update().catch(() => undefined);
        }
      });
    })
    .catch(() => undefined);

  return handle;
}
