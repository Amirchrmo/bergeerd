import type { ReactNode } from "react";

/** Labelled form field with an optional hint and error. */
export function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1">
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-warm-gray/50 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function inputCls(error?: string): string {
  return `w-full px-3 py-2.5 rounded-xl border ${
    error ? "border-red-400" : "border-black/10"
  } focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition bg-white`;
}

/** Centered modal with a title bar; used by every create/edit form. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-menu w-full max-w-lg my-8 animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-gradient-to-l from-brand/5 to-transparent rounded-t-2xl">
          <h2 className="text-lg font-bold text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-warm-gray/60 hover:bg-black/5 hover:text-charcoal transition-colors"
            aria-label="بستن"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Cancel + submit row at the bottom of a form. */
export function FormActions({
  saving,
  isEdit,
  onCancel,
}: {
  saving: boolean;
  isEdit: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-xl border border-black/10 text-warm-gray hover:bg-black/[0.03]"
      >
        انصراف
      </button>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark disabled:opacity-60 shadow-menu"
      >
        {saving ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "افزودن"}
      </button>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-menu w-full max-w-sm p-6 animate-fade-up">
        <h3 className="text-lg font-bold text-charcoal mb-2">{title}</h3>
        <p className="text-sm text-warm-gray mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-black/10 text-warm-gray hover:bg-black/[0.03]"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
      فعال
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-black/5 text-warm-gray/70 border border-black/5">
      غیرفعال
    </span>
  );
}

export function OrderBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-[2rem] justify-center px-2 py-0.5 rounded-lg bg-brand/10 text-brand text-xs font-medium tabular-nums">
      {value}
    </span>
  );
}

export function Notice({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const cls =
    kind === "error"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-emerald-800 bg-emerald-50 border-emerald-200";
  return <div className={`mb-4 text-sm border rounded-xl px-3 py-2 ${cls}`}>{children}</div>;
}

export function RowButton({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-black/10 text-warm-gray hover:border-brand/40 hover:text-brand hover:bg-brand/5"
      }`}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">{title}</h1>
        <p className="text-warm-gray/70 text-sm mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors shadow-menu shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

/** Message shown when a list is empty or still loading. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-20 text-warm-gray/50 bg-white rounded-2xl border border-black/5 shadow-card">
      {children}
    </div>
  );
}

/** White rounded card around a data table. */
export function TableCard({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-l from-brand/5 to-transparent text-warm-gray">
            <tr>
              {head.map((h) => (
                <th key={h} className="text-right px-4 py-3.5 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
