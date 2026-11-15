import { useState } from "react";
import { HttpError } from "../api";

/**
 * Submit state for the modal forms: a saving flag, per-field errors from the
 * API's validation response, and a general error message.
 */
export function useSubmit<T>(onSubmit: (value: T) => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function submit(value: T) {
    setFieldErrors({});
    setError("");
    setSaving(true);
    try {
      await onSubmit(value);
    } catch (err) {
      if (err instanceof HttpError && err.body?.fields) {
        setFieldErrors(err.body.fields);
      } else {
        setError(err instanceof Error ? err.message : "خطا در ذخیره‌سازی");
      }
    } finally {
      setSaving(false);
    }
  }

  return { saving, fieldErrors, error, setError, submit };
}
