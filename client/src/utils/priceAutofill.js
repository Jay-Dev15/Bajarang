import { WEIGHT_PRICES } from './constants';

/**
 * Auto-fill for weight prices in the product form.
 *
 * - `manualOrder` lists the weight fields the user typed into, in the order typed.
 * - The first of those that has a value is the "base" price.
 * - Every weight field the user has NOT typed into (lighter or heavier) is filled
 *   proportionally from the base, rounded to whole rupees:
 *     1 કિલો = ₹135  →  100 ગ્રામ = ₹14, 250 ગ્રામ = ₹34, 500 ગ્રામ = ₹68
 * - Fields the user typed into are never overwritten, so discounts like
 *   ₹20 / ₹35 / ₹60 stay exactly as entered.
 * - Clearing an auto-filled field marks it as typed, so it stays empty.
 */
export function applyWeightAutofill(form, manualOrder) {
  const manual = new Set(manualOrder);
  const base = manualOrder
    .map((key) => WEIGHT_PRICES.find((w) => w.key === key))
    .find((w) => w && form[w.key] !== '' && Number(form[w.key]) >= 0);

  const next = { ...form };
  for (const w of WEIGHT_PRICES) {
    if (manual.has(w.key)) continue;
    next[w.key] = base ? String(Math.round((Number(form[base.key]) * w.grams) / base.grams)) : '';
  }
  return next;
}

/** Weight fields currently holding an auto-filled (not typed) value. */
export const autoFilledKeys = (form, manualOrder) =>
  WEIGHT_PRICES.filter((w) => !manualOrder.includes(w.key) && form[w.key] !== '').map((w) => w.key);
