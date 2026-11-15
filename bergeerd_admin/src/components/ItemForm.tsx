import { useRef, useState } from "react";
import type { MenuItem, MenuItemInput } from "../types";
import { HttpError, uploadImage } from "../api";
import { useSubmit } from "../hooks/useSubmit";
import { Field, FormActions, Modal, Notice, inputCls } from "./ui";

interface ItemFormProps {
  item: MenuItem | null; // null = create mode
  /** The branch's categories, in display order. */
  categories: { value: string; label: string }[];
  /** Suggested order for new items (next free slot in the active tab). */
  defaultOrder?: number;
  onSubmit: (input: MenuItemInput) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({ item, categories, defaultOrder, onSubmit, onCancel }: ItemFormProps) {
  const [form, setForm] = useState<MenuItemInput>(
    item
      ? {
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          image_alt: item.image_alt,
          category: item.category,
          order: item.order,
          is_active: item.is_active,
        }
      : {
          name: "",
          description: "",
          price: "",
          image_url: "",
          image_alt: "",
          category: categories[0]?.value ?? "",
          order: defaultOrder ?? 1,
          is_active: true,
        },
  );
  const { saving, fieldErrors, error, setError, submit } = useSubmit(onSubmit);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof MenuItemInput>(key: K, value: MenuItemInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadImage(file);
      set("image_url", res.url);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "آپلود ناموفق بود");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const isEdit = !!item;

  return (
    <Modal title={isEdit ? "ویرایش آیتم" : "افزودن آیتم جدید"} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
        className="px-6 py-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">تصویر</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-black/5 border border-black/5 flex-shrink-0 shadow-sm">
              {form.image_url ? (
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-warm-gray/40 text-xs">
                  بدون تصویر
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                disabled={uploading}
                className="block w-full text-sm text-warm-gray file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand file:text-white file:cursor-pointer file:hover:bg-brand-dark"
              />
              {uploading && <p className="text-xs text-warm-gray/60 mt-1">در حال آپلود...</p>}
              <input
                type="text"
                value={form.image_url || ""}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="یا وارد کنید URL"
                className="mt-2 w-full px-3 py-1.5 text-sm rounded-xl border border-black/10 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
          </div>
        </div>

        <Field label="نام" error={fieldErrors.name} required>
          <input
            type="text"
            value={form.name || ""}
            onChange={(e) => set("name", e.target.value)}
            required
            className={inputCls(fieldErrors.name)}
            placeholder="برگر کلاسیک"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="دسته" error={fieldErrors.category} required hint="برای افزودن یا ویرایش دسته به صفحهٔ «دسته‌بندی‌ها» بروید.">
            <div role="radiogroup" aria-label="دسته" className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const active = form.category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set("category", c.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                      active
                        ? "bg-brand text-white border-brand shadow-menu"
                        : "bg-white text-warm-gray border-black/10 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="قیمت (تومان)" error={fieldErrors.price} required>
            <input
              type="text"
              value={form.price || ""}
              onChange={(e) => set("price", e.target.value)}
              required
              className={inputCls(fieldErrors.price)}
              placeholder="۵۹۰"
            />
          </Field>
        </div>

        <Field label="توضیحات" error={fieldErrors.description}>
          <textarea
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className={inputCls(fieldErrors.description)}
            placeholder="توضیحات آیتم..."
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="متن جایگزین تصویر" error={fieldErrors.image_alt}>
            <input
              type="text"
              value={form.image_alt || ""}
              onChange={(e) => set("image_alt", e.target.value)}
              className={inputCls(fieldErrors.image_alt)}
              placeholder="برگر کلاسیک"
            />
          </Field>
          <Field label="ترتیب نمایش" error={fieldErrors.order} hint="عدد کوچک‌تر = نمایش بالاتر در سایت">
            <input
              type="number"
              min={0}
              value={form.order ?? 0}
              onChange={(e) => set("order", Number(e.target.value))}
              className={inputCls(fieldErrors.order)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => set("is_active", e.target.checked)}
            className="w-4 h-4 rounded accent-brand"
          />
          <span className="text-sm text-charcoal">فعال (نمایش در سایت)</span>
        </label>

        {error && <Notice kind="error">{error}</Notice>}

        <FormActions saving={saving} isEdit={isEdit} onCancel={onCancel} />
      </form>
    </Modal>
  );
}
