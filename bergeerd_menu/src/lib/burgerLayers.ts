/**
 * Derives a burger's layer stack from its menu description.
 *
 * The menu data (static fallback and the admin-managed API) only has one flat
 * photo per item, so there are no per-layer image assets to pull apart.
 * Instead, the ingredients named in the existing Persian description are
 * mapped to illustrated SVG layers (see components/burger/layerArt.tsx). No
 * menu data is changed, and items edited in the admin panel are picked up
 * automatically.
 */

export type LayerKind =
  | "bunTop"
  | "bunBottom"
  | "ciabattaTop"
  | "ciabattaBottom"
  | "patty"
  | "chicken"
  | "cheddar"
  | "smokedCheese"
  | "whiteCheese"
  | "lettuce"
  | "tomato"
  | "onion"
  | "caramelOnion"
  | "scallion"
  | "pickles"
  | "cucumber"
  | "jalapeno"
  | "paprika"
  | "bacon"
  | "basil"
  | "mushroom"
  | "sauceBurger"
  | "sauceGarlic"
  | "sauceMango"
  | "sauce";

export interface BurgerLayer {
  kind: LayerKind;
  /** Persian label shown next to the layer when the burger is opened. */
  label: string;
}

export interface BurgerRecipe {
  /** Layers from top to bottom. */
  layers: BurgerLayer[];
  /** Description mentions a side of fries ("به همراه سیب زمینی"). */
  withFries: boolean;
}

/** Top-to-bottom position of each filling between the breads. */
const FILLING_ORDER: LayerKind[] = [
  "sauceBurger",
  "sauceGarlic",
  "sauceMango",
  "sauce",
  "lettuce",
  "tomato",
  "onion",
  "scallion",
  "pickles",
  "cucumber",
  "basil",
  "jalapeno",
  "paprika",
  "bacon",
  "caramelOnion",
  "mushroom",
  "cheddar",
  "smokedCheese",
  "whiteCheese",
  "patty",
  "chicken",
];

interface Rule {
  re: RegExp;
  kind: LayerKind;
  label: string | ((m: RegExpMatchArray) => string);
}

// Order matters: longer phrases are consumed first so that e.g. "پیاز کاراملی"
// is not also counted as plain "پیاز", and "خیارشور" is not also "خیار".
const RULES: Rule[] = [
  {
    re: /([۰-۹0-9]+)\s*گرم\s*(فیله\s*)?مرغ/,
    kind: "chicken",
    label: (m) => `${m[1]} گرم فیله مرغ`,
  },
  { re: /فیله\s*مرغ|مرغ/, kind: "chicken", label: "فیله مرغ" },
  {
    re: /([۰-۹0-9]+)\s*گرم\s*گوشت/,
    kind: "patty",
    label: (m) => `${m[1]} گرم گوشت`,
  },
  { re: /گوشت/, kind: "patty", label: "گوشت" },
  { re: /سس\s*قارچ/, kind: "mushroom", label: "سس قارچ" },
  { re: /قارچ/, kind: "mushroom", label: "قارچ" },
  { re: /سس\s*برگرد/, kind: "sauceBurger", label: "سس برگرد" },
  { re: /سس\s*سیر/, kind: "sauceGarlic", label: "سس سیر" },
  { re: /سس\s*انبه(\s*و\s*چیلی)?|سس\s*چیلی/, kind: "sauceMango", label: "سس انبه و چیلی" },
  { re: /پنیر\s*چدار/, kind: "cheddar", label: "پنیر چدار" },
  { re: /پنیر\s*دودی/, kind: "smokedCheese", label: "پنیر دودی" },
  { re: /پنیر\s*لیقوان|لیقوان/, kind: "whiteCheese", label: "پنیر لیقوان" },
  { re: /پنیر/, kind: "cheddar", label: "پنیر" },
  { re: /بیکن\s*دودی/, kind: "bacon", label: "بیکن دودی" },
  { re: /بیکن/, kind: "bacon", label: "بیکن" },
  { re: /هالوپینو/, kind: "jalapeno", label: "هالوپینو" },
  { re: /پیاز\s*کاراملی/, kind: "caramelOnion", label: "پیاز کاراملی" },
  { re: /پیازچه/, kind: "scallion", label: "پیازچه" },
  { re: /پیاز/, kind: "onion", label: "پیاز" },
  { re: /خیار\s*شور/, kind: "pickles", label: "خیارشور" },
  { re: /خیار/, kind: "cucumber", label: "خیار" },
  { re: /گوجه/, kind: "tomato", label: "گوجه" },
  { re: /کاهو/, kind: "lettuce", label: "کاهو" },
  { re: /ریحان/, kind: "basil", label: "ریحان" },
  { re: /پاپریکای?\s*کبابی/, kind: "paprika", label: "پاپریکای کبابی" },
  { re: /پاپریکا/, kind: "paprika", label: "پاپریکا" },
  { re: /سس\s*([^\s،,.]+)/, kind: "sauce", label: (m) => `سس ${m[1]}` },
];

/** Unifies Arabic/Persian letter variants and zero-width joiners. */
function normalize(text: string): string {
  return text
    .replace(/‌/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

const cache = new Map<string, BurgerRecipe | null>();

/**
 * Returns the layer stack for a stackable item (bread + a protein), or null
 * for everything else (fries, drinks, add-ons...).
 */
export function parseBurgerRecipe(description: string): BurgerRecipe | null {
  if (cache.has(description)) return cache.get(description)!;

  let text = normalize(description || "");
  const withFries = /سیب\s*زمینی/.test(text);
  // The side of fries is not a layer; drop it before matching ingredients.
  text = text.replace(/به\s*همراه\s*سیب\s*زمینی/g, " ");

  const isCiabatta = /چاپاتا/.test(text);
  const hasBread = /نان/.test(text);
  const breadLabel = isCiabatta
    ? "نان چاپاتا"
    : /کره\s*ای/.test(text)
      ? "نان کره‌ای"
      : "نان";
  text = text.replace(/نان(\s*چاپاتا)?(\s*کره\s*ای)?/g, " ");

  const found = new Map<LayerKind, BurgerLayer>();
  for (const rule of RULES) {
    // Consume every occurrence so a later, shorter rule can't re-match it.
    for (;;) {
      const m = text.match(rule.re);
      if (!m || m.index === undefined) break;
      if (!found.has(rule.kind)) {
        const label =
          typeof rule.label === "function" ? rule.label(m) : rule.label;
        found.set(rule.kind, { kind: rule.kind, label });
      }
      text =
        text.slice(0, m.index) +
        " ".repeat(m[0].length) +
        text.slice(m.index + m[0].length);
    }
  }

  const hasProtein = found.has("patty") || found.has("chicken");
  if (!hasBread || !hasProtein) {
    cache.set(description, null);
    return null;
  }

  const fillings = FILLING_ORDER.filter((k) => found.has(k)).map(
    (k) => found.get(k)!,
  );

  const recipe: BurgerRecipe = {
    layers: [
      { kind: isCiabatta ? "ciabattaTop" : "bunTop", label: breadLabel },
      ...fillings,
      { kind: isCiabatta ? "ciabattaBottom" : "bunBottom", label: "" },
    ],
    withFries,
  };
  cache.set(description, recipe);
  return recipe;
}

/** A generic classic burger, used where no menu item is involved (loader). */
export const DEFAULT_RECIPE: BurgerRecipe = {
  layers: [
    { kind: "bunTop", label: "نان کره‌ای" },
    { kind: "sauceBurger", label: "سس برگرد" },
    { kind: "lettuce", label: "کاهو" },
    { kind: "tomato", label: "گوجه" },
    { kind: "cheddar", label: "پنیر چدار" },
    { kind: "patty", label: "گوشت" },
    { kind: "bunBottom", label: "" },
  ],
  withFries: false,
};

/** Converts Western digits to Persian digits for display. */
export function toPersianDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}
