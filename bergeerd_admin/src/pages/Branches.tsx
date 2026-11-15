import { useEffect, useState } from "react";
import type { Branch, BranchInput } from "../types";
import { THEMES } from "../types";
import { createBranch, deleteBranch, updateBranch } from "../api";
import { siteUrl, useBranch } from "../branch";
import { useSubmit } from "../hooks/useSubmit";
import {
  ActiveBadge,
  ConfirmDialog,
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

const themeLabel = (key: string) => THEMES.find((t) => t.value === key)?.label ?? key;

/** Restaurant branches: each has its own menu, prices, design and address. */
export default function Branches() {
  const { branches, reload, select } = useBranch();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(input: BranchInput) {
    if (editing) {
      await updateBranch(editing.id, input);
      setSuccess(`شعبهٔ «${input.name || editing.name}» ویرایش شد.`);
    } else {
      const created = await createBranch(input);
      select(created.id);
      setSuccess(
        `شعبهٔ «${created.name}» ساخته شد و برای مدیریت منو انتخاب شد${input.copy_from ? " (منو کپی شد؛ حالا قیمت‌ها را تنظیم کنید)" : ""}.`,
      );
    }
    setShowForm(false);
    setEditing(null);
    await reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBranch(deleteTarget.id);
      setSuccess(`شعبهٔ «${deleteTarget.name}» حذف شد.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف");
    } finally {
      setDeleteTarget(null);
    }
  }

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 6000);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <div>
      <PageHeader
        title="شعبه‌ها"
        subtitle="هر شعبه منو، قیمت‌ها، طراحی و آدرس صفحهٔ خودش را دارد. شعبهٔ اصلی در صفحهٔ اول سایت (و QR کدهای فعلی) نمایش داده می‌شود."
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + افزودن شعبه
          </PrimaryButton>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}

      <TableCard head={["نام", "آدرس صفحه", "طراحی", "ترتیب", "وضعیت", "عملیات"]}>
        {branches.map((b) => (
          <tr key={b.id} className="hover:bg-brand/[0.03] transition-colors">
            <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">
              {b.name}
              {b.is_default && (
                <span className="mr-2 inline-flex px-2 py-0.5 rounded-full text-[11px] bg-brand/10 text-brand">
                  اصلی
                </span>
              )}
            </td>
            <td className="px-4 py-3">
              <a
                href={siteUrl(b)}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="font-mono text-xs text-warm-gray hover:text-brand"
              >
                /{b.is_default ? "" : b.slug}
              </a>
            </td>
            <td className="px-4 py-3 text-warm-gray/80 text-xs">{themeLabel(b.theme)}</td>
            <td className="px-4 py-3">
              <OrderBadge value={b.order} />
            </td>
            <td className="px-4 py-3">
              <ActiveBadge active={b.is_active} />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <RowButton
                  onClick={() => {
                    setEditing(b);
                    setShowForm(true);
                  }}
                >
                  ویرایش
                </RowButton>
                {!b.is_default && (
                  <RowButton danger onClick={() => setDeleteTarget(b)}>
                    حذف
                  </RowButton>
                )}
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {showForm && (
        <BranchForm
          branch={editing}
          branches={branches}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="حذف شعبه"
          message={`با حذف «${deleteTarget.name}» همهٔ دسته‌ها و آیتم‌های منوی این شعبه برای همیشه حذف می‌شوند و آدرس /${deleteTarget.slug} از کار می‌افتد. اگر فقط می‌خواهید موقتاً پنهانش کنید، آن را غیرفعال کنید.`}
          confirmLabel="حذف شعبه"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

const TEXT_FIELDS: { key: keyof BranchInput; label: string; placeholder: string; ltr?: boolean; hint?: string }[] = [
  { key: "address", label: "آدرس", placeholder: "تهران، ..." },
  { key: "phone", label: "تلفن", placeholder: "+98 21 1234 5678", ltr: true },
  { key: "hours", label: "ساعت کاری", placeholder: "هر روز ۱۲ تا ۲۴" },
  { key: "instagram", label: "اینستاگرام", placeholder: "bergeerd", ltr: true, hint: "فقط نام کاربری" },
  {
    key: "map_url",
    label: "لینک مسیریابی",
    placeholder: "https://maps.app.goo.gl/...",
    ltr: true,
    hint: "لینک «Share» در گوگل مپ",
  },
];

function BranchForm({
  branch,
  branches,
  onSubmit,
  onCancel,
}: {
  branch: Branch | null;
  branches: Branch[];
  onSubmit: (input: BranchInput) => Promise<void>;
  onCancel: () => void;
}) {
  const nextOrder = branches.length === 0 ? 1 : Math.max(...branches.map((b) => b.order)) + 1;
  const [form, setForm] = useState<BranchInput>(
    branch
      ? {
          name: branch.name,
          slug: branch.slug,
          theme: branch.theme,
          order: branch.order,
          is_active: branch.is_active,
          address: branch.address,
          phone: branch.phone,
          hours: branch.hours,
          map_url: branch.map_url,
          map_embed_url: branch.map_embed_url,
          instagram: branch.instagram,
        }
      : {
          name: "",
          slug: "",
          theme: THEMES[0].value,
          order: nextOrder,
          is_active: true,
          copy_from: branches.find((b) => b.is_default)?.id ?? "",
        },
  );
  const { saving, fieldErrors, error, submit } = useSubmit(onSubmit);

  function set<K extends keyof BranchInput>(key: K, value: BranchInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isEdit = !!branch;
  const slugChanged = isEdit && branch && !branch.is_default && form.slug !== branch.slug;

  return (
    <Modal title={isEdit ? `ویرایش شعبهٔ ${branch!.name}` : "افزودن شعبهٔ جدید"} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
        className="px-6 py-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="نام شعبه" error={fieldErrors.name} required>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
              required
              className={inputCls(fieldErrors.name)}
              placeholder="تهران"
            />
          </Field>
          <Field
            label="آدرس صفحه (slug)"
            error={fieldErrors.slug}
            required
            hint={
              <span dir="ltr">
                bergeerd.ir/{form.slug || "tehran"}
              </span>
            }
          >
            <input
              type="text"
              value={form.slug || ""}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              required
              minLength={2}
              maxLength={40}
              pattern="(?!(admin|api|assets|health|bergeerd-minio|default)$)[a-z0-9]+(-[a-z0-9]+)*"
              title="حروف کوچک انگلیسی، عدد و خط تیره (نام‌های admin، api، assets، health و default رزرو هستند)"
              dir="ltr"
              className={inputCls(fieldErrors.slug)}
              placeholder="tehran"
            />
          </Field>
        </div>

        {slugChanged && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            توجه: QR کدها و لینک‌هایی که به آدرس قبلی (/{branch!.slug}) اشاره می‌کنند دیگر کار نمی‌کنند.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="طراحی سایت" error={fieldErrors.theme}>
            <select
              value={form.theme}
              onChange={(e) => set("theme", e.target.value)}
              className={inputCls(fieldErrors.theme)}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ترتیب" error={fieldErrors.order}>
            <input
              type="number"
              min={0}
              value={form.order ?? 0}
              onChange={(e) => set("order", Number(e.target.value))}
              className={inputCls(fieldErrors.order)}
            />
          </Field>
        </div>

        {!isEdit && (
          <Field
            label="منوی اولیه"
            error={fieldErrors.copy_from}
            hint="دسته‌ها و آیتم‌های شعبهٔ انتخاب‌شده کپی می‌شوند؛ بعداً قیمت‌ها و آیتم‌ها را مستقل تغییر دهید."
          >
            <select
              value={form.copy_from || ""}
              onChange={(e) => set("copy_from", e.target.value)}
              className={inputCls(fieldErrors.copy_from)}
            >
              <option value="">منوی خالی</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  کپی از منوی {b.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEXT_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} error={fieldErrors[f.key]} hint={f.hint}>
              <input
                type="text"
                value={(form[f.key] as string) || ""}
                onChange={(e) => set(f.key, e.target.value)}
                dir={f.ltr ? "ltr" : undefined}
                className={inputCls(fieldErrors[f.key])}
                placeholder={f.placeholder}
              />
            </Field>
          ))}
        </div>

        <Field
          label="نقشه (Embed گوگل مپ)"
          error={fieldErrors.map_embed_url}
          hint="در گوگل مپ: Share ← Embed a map ← کد را کامل اینجا بچسبانید."
        >
          <textarea
            value={form.map_embed_url || ""}
            onChange={(e) => set("map_embed_url", embedSrc(e.target.value))}
            rows={2}
            dir="ltr"
            className={`${inputCls(fieldErrors.map_embed_url)} font-mono text-xs`}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </Field>

        <label className={`flex items-center gap-2 ${branch?.is_default ? "opacity-60" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            disabled={branch?.is_default}
            onChange={(e) => set("is_active", e.target.checked)}
            className="w-4 h-4 rounded accent-brand"
          />
          <span className="text-sm text-charcoal">
            فعال (صفحهٔ شعبه در سایت در دسترس است)
            {branch?.is_default && " — شعبهٔ اصلی همیشه فعال است"}
          </span>
        </label>
        {fieldErrors.is_active && <p className="text-xs text-red-500">{fieldErrors.is_active}</p>}

        {error && <Notice kind="error">{error}</Notice>}

        <FormActions saving={saving} isEdit={isEdit} onCancel={onCancel} />
      </form>
    </Modal>
  );
}

/** Accepts either the embed URL or Google's whole <iframe> snippet. */
function embedSrc(value: string): string {
  const m = value.match(/src="([^"]+)"/);
  return m ? m[1] : value;
}
