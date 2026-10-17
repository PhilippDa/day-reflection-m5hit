import { de } from "../../../i18n/de";
import { useStore } from "../../StoreContext";

export function LoadErrorView() {
  const error = useStore().loadError.value;
  return (
    <main>
      <h1>{de.errors.loadTitle}</h1>
      <p>{de.errors.loadHint}</p>
      {error ? <p role="alert">{de.errors.load[error.code]}</p> : null}
    </main>
  );
}
