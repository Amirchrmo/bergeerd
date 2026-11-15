/** Converts Western digits to Persian digits for display. */
export function toPersianDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

/** tel: link for a phone number as typed in the admin panel. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Profile link for an Instagram username. */
export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}
