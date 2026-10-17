import styles from "./TabBar.module.css";

export interface Tab<Id extends string> {
  readonly id: Id;
  readonly label: string;
}

export interface TabBarProps<Id extends string> {
  /** Names the navigation landmark for screen readers. */
  readonly label: string;
  readonly tabs: readonly Tab<Id>[];
  readonly active: Id;
  readonly onSelect: (id: Id) => void;
}

/** A navigation bar fixed to the bottom of the screen, above the iPhone home indicator. */
export function TabBar<Id extends string>({ label, tabs, active, onSelect }: TabBarProps<Id>) {
  return (
    <nav class={styles["bar"] ?? ""} aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          class={`${styles["tab"] ?? ""} ${tab.id === active ? (styles["active"] ?? "") : ""}`}
          aria-current={tab.id === active ? "page" : undefined}
          onClick={() => {
            onSelect(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
