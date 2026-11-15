import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface ActiveCardValue {
  activeId: string | null;
  setActiveId: Dispatch<SetStateAction<string | null>>;
}

const ActiveCardContext = createContext<ActiveCardValue | null>(null);

/**
 * Tracks which menu card currently has its burger opened, so only one is open
 * at a time. A tap/click anywhere outside the open card closes it (the
 * mobile "tap outside" behaviour), as does Escape.
 */
export function ActiveCardProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest(`[data-card-id="${CSS.escape(activeId)}"]`)) {
        setActiveId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [activeId]);

  const value = useMemo(() => ({ activeId, setActiveId }), [activeId]);
  return (
    <ActiveCardContext.Provider value={value}>
      {children}
    </ActiveCardContext.Provider>
  );
}

export function useActiveCard(): ActiveCardValue {
  const ctx = useContext(ActiveCardContext);
  if (!ctx) throw new Error("useActiveCard must be used in ActiveCardProvider");
  return ctx;
}
