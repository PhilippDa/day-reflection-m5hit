import { createContext, type ComponentChildren } from "preact";
import { useContext } from "preact/hooks";
import type { Store } from "../state/store";

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  store,
  children,
}: {
  readonly store: Store;
  readonly children: ComponentChildren;
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** For features only. Patterns and primitives receive plain props instead. */
export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used inside a StoreProvider");
  }
  return store;
}
