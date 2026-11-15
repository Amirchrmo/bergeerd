import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listBranches } from "./api";
import type { Branch } from "./types";

interface BranchContextValue {
  branches: Branch[];
  /** The branch the menu and category pages are managing. */
  current: Branch | null;
  select: (id: string) => void;
  reload: () => Promise<void>;
  error: string;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

const SELECTED_KEY = "bergeerd_admin_branch";

// The public site; empty = same origin (production, where the panel is /admin/).
const SITE_URL = (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");

/** Public website address of a branch: the default branch lives at the root. */
export function siteUrl(branch: Branch): string {
  return `${SITE_URL}/${branch.is_default ? "" : branch.slug}`;
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(SELECTED_KEY) ?? "");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setBranches(await listBranches());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری شعبه‌ها");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const select = useCallback((id: string) => {
    localStorage.setItem(SELECTED_KEY, id);
    setSelectedId(id);
  }, []);

  const value = useMemo<BranchContextValue>(() => {
    const current =
      branches.find((b) => b.id === selectedId) ??
      branches.find((b) => b.is_default) ??
      branches[0] ??
      null;
    return { branches, current, select, reload, error };
  }, [branches, selectedId, select, reload, error]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return ctx;
}
