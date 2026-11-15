import { useEffect, useMemo, useState } from "react";
import type { Category, CategoryInput } from "../types";
import { createCategory, deleteCategory, updateCategory } from "../api";
import { useBranch } from "../branch";
import { useCategories } from "../hooks/useCategories";
import { useSubmit } from "../hooks/useSubmit";
import {
  ActiveBadge,
  ConfirmDialog,
  EmptyState,
  Field,
  FormActions,
  Modal,
  Notice,
  OrderBadge,
  PageHeader,
  PrimaryButton,
  RowButton,
  TableCard,
  inputCls,
} from "../components/ui";

/** Categories of the selected branch. */
export default function Categories() {
  const { current: branch } = useBranch();
  const { categories, error: loadError, reload } = useCategories(branch!.id);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Same order as the website's sections.
  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "fa")),
    [categories],
  );
  const nextOrder = categories.length === 0 ? 1 : Math.max(...categories.map((c) => c.order)) + 1;

  async function handleSubmit(input: CategoryInput) {
    if (editing) {
      await updateCategory(editing.id, input);
      setSuccess(`دستهٔ «${input.title || editing.title}» با موفقیت ویرایش شد.`);
    } else {
      await createCategory(branch!.id, input);
      setSuccess(`دستهٔ «${input.title}» با موفقیت ساخته شد.`);
    }
    setShowForm(false);
    setEditing(null);
    await reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setSuccess(`دستهٔ «${deleteTarget.title}» حذف شد.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف");
    } finally {
      setDeleteTarget(null);
    }
  }

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <div>
      <PageHeader
        title={
          <>
            دسته‌بندی‌ها <span className="text-brand">— {branch!.name}</span>
          </>
        }
        subtitle="ترتیب نمایش در سایت مطابق ستون «ترتیب» است (عدد کوچک‌تر = بالاتر)."
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + افزودن دسته
          </PrimaryButton>
        }
      />

      {(error || loadError) && <Notice kind="error">{error || loadError}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}

      {sorted.length === 0 ? (
        <EmptyState>دسته‌ای وجود ندارد. روی «افزودن دسته» بزنید.</EmptyState>
      ) : (
        <TableCard head={["عنوان", "شناسه (slug)", "ترتیب", "وضعیت", "عملیات"]}>
          {sorted.map((cat) => (
            <tr key={cat.id} className="hover:bg-brand/[0.03] transition-colors">
              <td className="px-4 py-3 font-medium text-charcoal">{cat.title}</td>
              <td className="px-4 py-3 text-warm-gray/70 ltr-text font-mono text-xs">{cat.slug}</td>
              <td className="px-4 py-3">
                <OrderBadge value={cat.order} />
              </td>
              <td className="px-4 py-3">
                <ActiveBadge active={cat.is_active} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <RowButton
                    onClick={() => {
                      setEditing(cat);
                      setShowForm(true);
                    }}
                  >
                    ویرایش
                  </RowButton>
                  <RowButton danger onClick={() => setDeleteTarget(cat)}>
                    حذف
                  </RowButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {showForm && (
        <CategoryForm
          category={editing}
          defaultOrder={editing ? undefined : nextOrder}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="حذف دسته"
          message={`آیا از حذف دسته «${deleteTarget.title}» مطمئن هستید؟ آیتم‌های منو با این دسته حذف نمی‌شوند اما دیگر در سایت نمایش داده نمی‌شوند.`}
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function CategoryForm({
  category,
  defaultOrder,
  onSubmit,
  onCancel,
}: {
  category: Category | null;
  defaultOrder?: number;
  onSubmit: (input: CategoryInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CategoryInput>(
    category
      ? { slug: category.slug, title: category.title, order: category.order, is_active: category.is_active }
      : { slug: "", title: "", order: defaultOrder ?? 1, is_active: true },
  );
  const { saving, fieldErrors, error, submit } = useSubmit(onSubmit);

  function set<K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isEdit = !!category;

  return (
    <Modal title={isEdit ? "ویرایش دسته" : "افزودن دسته جدید"} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
        className="px-6 py-5 space-y-4"
      >
        <Field label="عنوان" error={fieldErrors.title} required>
          <input
            type="text"
            value={form.title || ""}
            onChange={(e) => set("title", e.target.value)}
            required
            className={inputCls(fieldErrors.title)}
            placeholder="برگرها"
          />
        </Field>

        <Field
          label="شناسه (slug)"
          error={fieldErrors.slug}
          required
          hint="حروف کوچک انگلیسی، اعداد و خط تیره. مثال: burgers"
        >
          <input
            type="text"
            value={form.slug || ""}
            onChange={(e) => set("slug", e.target.value)}
            required
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="حروف کوچک انگلیسی، عدد و خط تیره"
            dir="ltr"
            className={inputCls(fieldErrors.slug)}
            placeholder="burgers"
          />
        </Field>

        {isEdit && category && (form.slug || "") !== category.slug && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            توجه: با تغییر شناسه (slug)، آیتم‌های منویی که از شناسهٔ قدیمی («{category.slug}») استفاده
            می‌کنند دیگر در این دسته نمایش داده نمی‌شوند. بهتر است فقط عنوان یا ترتیب را تغییر دهید، مگر
            اینکه قصد دارید آیتم‌ها را هم به‌صورت دستی به‌روزرسانی کنید.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ترتیب نمایش" error={fieldErrors.order} hint="عدد کوچک‌تر = نمایش بالاتر در سایت">
            <input
              type="number"
              min={0}
              value={form.order ?? 0}
              onChange={(e) => set("order", Number(e.target.value))}
              className={inputCls(fieldErrors.order)}
            />
          </Field>
          <Field label="وضعیت">
            <label className="flex items-center gap-2 cursor-pointer h-full pt-2">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => set("is_active", e.target.checked)}
                className="w-4 h-4 rounded accent-brand"
              />
              <span className="text-sm text-charcoal">فعال (نمایش در سایت)</span>
            </label>
          </Field>
        </div>

        {error && <Notice kind="error">{error}</Notice>}

        <FormActions saving={saving} isEdit={isEdit} onCancel={onCancel} />
      </form>
    </Modal>
  );
}
