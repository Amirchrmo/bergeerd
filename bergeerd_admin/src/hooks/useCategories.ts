import { useCallback, useEffect, useMemo, useState } from "react";
import { listCategories } from "../api";
import type { Category } from "../types";

/**
 * A branch's categories, plus the `{ value, label }` options (in display
 * order) used by the menu page's tabs and the item form.
 */
export function useCategories(branchId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!branchId) return;
    try {
      setCategories(await listCategories(branchId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری دسته‌ها");
    }
  }, [branchId]);

  useEffect(() => {
    setCategories([]);
    reload();
  }, [reload]);

  const options = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "fa"))
        .map((c) => ({ value: c.slug, label: c.title || c.slug })),
    [categories],
  );

  const titleBySlug = useCallback(
    (slug: string) => categories.find((c) => c.slug === slug)?.title || slug,
    [categories],
  );

  return { categories, options, titleBySlug, error, reload };
}
