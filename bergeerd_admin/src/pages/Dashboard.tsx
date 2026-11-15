import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { MenuItem, MenuItemInput } from "../types";
import { createMenuItem, deleteMenuItem, listMenuItems, updateMenuItem } from "../api";
import { siteUrl, useBranch } from "../branch";
import ItemForm from "../components/ItemForm";
import {
  ActiveBadge,
  ConfirmDialog,
  EmptyState,
  Notice,
  OrderBadge,
  PageHeader,
  PrimaryButton,
  RowButton,
  TableCard,
} from "../components/ui";
import { useCategories } from "../hooks/useCategories";

/** Menu items of the selected branch. */
export default function Dashboard() {
  const { current: branch } = useBranch();
  const branchId = branch!.id;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const { categories, options: catOptions, titleBySlug, error: catError } = useCategories(branchId);

  const load = useCallback(async () => {
    setError("");
    try {
      setItems(await listMenuItems(branchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    setLoading(true);
    setItems([]);
    setActiveCat("all");
    load();
  }, [load]);

  // Category priority, then item priority — the order the website shows.
  const catOrder = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) map[c.slug] = c.order;
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const list = activeCat === "all" ? items : items.filter((i) => i.category === activeCat);
    const rank = (slug: string) => catOrder[slug] ?? Number.MAX_SAFE_INTEGER;
    return [...list].sort(
      (a, b) =>
        rank(a.category) - rank(b.category) ||
        a.order - b.order ||
        a.name.localeCompare(b.name, "fa"),
    );
  }, [items, activeCat, catOrder]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const i of items) map[i.category] = (map[i.category] ?? 0) + 1;
    return map;
  }, [items]);

  const nextOrderHint = useMemo(() => {
    const inCat = activeCat === "all" ? items : items.filter((i) => i.category === activeCat);
    return inCat.length === 0 ? 1 : Math.max(...inCat.map((i) => i.order)) + 1;
  }, [items, activeCat]);

  async function handleSubmit(input: MenuItemInput) {
    if (editing) {
      await updateMenuItem(editing.id, input);
    } else {
      await createMenuItem(branchId, input);
    }
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function savePrice(item: MenuItem, price: string) {
    const updated = await updateMenuItem(item.id, { price });
    setItems((list) => list.map((i) => (i.id === item.id ? updated : i)));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMenuItem(deleteTarget.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف");
    } finally {
      setDeleteTarget(null);
    }
  }

  const noCategories = catOptions.length === 0;

  return (
    <div>
      <PageHeader
        title={
          <>
            مدیریت منو <span className="text-brand">— {branch!.name}</span>
          </>
        }
        subtitle={
          <>
            ترتیب نمایش با عدد کوچک‌تر = بالاتر در سایت. برای تغییر سریع قیمت روی آن بزنید.{" "}
            <a href={siteUrl(branch!)} target="_blank" rel="noreferrer" className="text-brand hover:underline">
              مشاهده در سایت ↗
            </a>
          </>
        }
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            disabled={noCategories}
          >
            + افزودن آیتم
          </PrimaryButton>
        }
      />

      {(error || catError) && <Notice kind="error">{error || catError}</Notice>}

      <div className="flex gap-1 mb-5 border-b border-black/5 overflow-x-auto pb-px">
        <Tab active={activeCat === "all"} onClick={() => setActiveCat("all")} label="همه" count={counts.all} />
        {catOptions.map((c) => (
          <Tab
            key={c.value}
            active={activeCat === c.value}
            onClick={() => setActiveCat(c.value)}
            label={c.label}
            count={counts[c.value] ?? 0}
          />
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-warm-gray/50">در حال بارگذاری...</div>
      ) : noCategories ? (
        <EmptyState>
          این شعبه هنوز دسته‌ای ندارد. ابتدا در{" "}
          <Link to="/categories" className="text-brand hover:underline">
            دسته‌بندی‌ها
          </Link>{" "}
          دسته بسازید، یا هنگام ساخت شعبه منوی شعبهٔ دیگری را کپی کنید.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>آیتمی وجود ندارد. روی «افزودن آیتم» بزنید.</EmptyState>
      ) : (
        <TableCard head={["تصویر", "نام", "دسته", "قیمت", "ترتیب", "وضعیت", "عملیات"]}>
          {filtered.map((item) => (
            <tr key={item.id} className="hover:bg-brand/[0.03] transition-colors">
              <td className="px-4 py-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 shadow-sm">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.image_alt} className="w-full h-full object-cover" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-charcoal">{item.name}</td>
              <td className="px-4 py-3 text-warm-gray/80">{titleBySlug(item.category)}</td>
              <td className="px-4 py-3 text-charcoal tabular-nums">
                <PriceCell item={item} onSave={savePrice} />
              </td>
              <td className="px-4 py-3">
                <OrderBadge value={item.order} />
              </td>
              <td className="px-4 py-3">
                <ActiveBadge active={item.is_active} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <RowButton
                    onClick={() => {
                      setEditing(item);
                      setShowForm(true);
                    }}
                  >
                    ویرایش
                  </RowButton>
                  <RowButton danger onClick={() => setDeleteTarget(item)}>
                    حذف
                  </RowButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {showForm && (
        <ItemForm
          item={editing}
          categories={catOptions}
          defaultOrder={editing ? undefined : nextOrderHint}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="حذف آیتم"
          message={`آیا از حذف «${deleteTarget.name}» از منوی ${branch!.name} مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/** Price shown as text; click to edit in place, Enter saves, Esc cancels. */
function PriceCell({ item, onSave }: { item: MenuItem; onSave: (item: MenuItem, price: string) => Promise<void> }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function commit() {
    if (draft === null || saving) return;
    const price = draft.trim();
    if (!price || price === item.price) {
      setDraft(null);
      return;
    }
    setSaving(true);
    try {
      await onSave(item, price);
      setDraft(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  if (draft === null) {
    return (
      <button
        onClick={() => setDraft(item.price)}
        title="ویرایش قیمت"
        className="rounded-lg px-2 py-1 -mx-2 hover:bg-brand/5 hover:text-brand transition-colors whitespace-nowrap"
      >
        {item.price} تومان
      </button>
    );
  }
  return (
    <div>
      <input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(null);
        }}
        aria-label={`قیمت ${item.name}`}
        className="w-24 px-2 py-1 rounded-lg border border-brand focus:ring-2 focus:ring-brand/20 outline-none"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
        active ? "border-brand text-brand" : "border-transparent text-warm-gray/70 hover:text-charcoal"
      }`}
    >
      {label} <span className={`text-xs ${active ? "opacity-70" : "opacity-50"}`}>({count})</span>
    </button>
  );
}
