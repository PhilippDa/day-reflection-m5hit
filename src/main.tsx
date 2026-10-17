import { render } from "preact";
import { requestPersistence } from "./pwa/persist";
import { registerServiceWorker } from "./pwa/register";
import { createStore } from "./state/store";
import { createIndexedDbPort } from "./storage/indexeddb";
import { createRepository } from "./storage/repository";
import "./ui/tokens.css";
import { App } from "./ui/App";
import { StoreProvider } from "./ui/StoreContext";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root element #app not found");
}

const store = createStore({ repository: createRepository(createIndexedDbPort()) });

// A Home Screen app can stay alive for days: move "today" forward when it comes back to the front.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    store.syncToday();
  }
});

// Only in a production build: the dev server has no service worker, and a stale one would confuse it.
const update = import.meta.env.PROD ? registerServiceWorker() : undefined;

render(
  <StoreProvider store={store}>
    <App {...(update ? { update } : {})} />
  </StoreProvider>,
  root,
);
void store.load().then(() => requestPersistence());
