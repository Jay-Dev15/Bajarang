import mongoose from 'mongoose';
import { badRequest, notFound } from './ApiError.js';

export const isObjectId = (value) => typeof value === 'string' && mongoose.isValidObjectId(value) && value.length === 24;

export function assertObjectId(id, message) {
  if (!isObjectId(id)) throw notFound(message);
}

export function cleanString(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/\s+/g, ' ').slice(0, max);
}

/** Parses an optional price. Empty -> null. Invalid -> undefined. */
export function parsePrice(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0 || n > 1000000) return undefined;
  return Math.round(n * 100) / 100;
}

const PRICE_LABELS = {
  purchasePricePerKg: 'ખરીદ ભાવ',
  sellingPrice100g: '100 ગ્રામનો ભાવ',
  sellingPrice250g: '250 ગ્રામનો ભાવ',
  sellingPrice500g: '500 ગ્રામનો ભાવ',
  sellingPrice1kg: '1 કિલોનો ભાવ',
  sellingPricePerPiece: '1 નંગનો ભાવ',
};
const SELLING_KEYS = Object.keys(PRICE_LABELS).filter((k) => k.startsWith('selling'));
const AT_LEAST_ONE_PRICE = 'ઓછામાં ઓછો એક વેચાણ ભાવ લખો (ગ્રામ, કિલો કે નંગ).';
const AT_LEAST_ONE_VISIBLE = 'ઓછામાં ઓછો એક ભાવ ભાવ યાદીમાં બતાવવો જરૂરી છે.';

/** Validates the full product form. Returns only allowed, cleaned fields. */
export function validateProductInput(body = {}) {
  const fields = {};
  const data = {};

  data.nameGujarati = cleanString(body.nameGujarati, 80);
  if (!data.nameGujarati) fields.nameGujarati = 'વસ્તુનું ગુજરાતી નામ લખો.';

  data.nameEnglish = cleanString(body.nameEnglish, 80);

  if (body.categoryId === undefined || body.categoryId === null || body.categoryId === '') {
    data.categoryId = null;
  } else if (isObjectId(body.categoryId)) {
    data.categoryId = body.categoryId;
  } else {
    fields.categoryId = 'કેટેગરી બરાબર નથી.';
  }

  for (const [key, label] of Object.entries(PRICE_LABELS)) {
    const parsed = parsePrice(body[key]);
    if (parsed === undefined) fields[key] = `${label} સાચો આંકડો હોવો જોઈએ.`;
    else data[key] = parsed;
  }
  // Hidden prices: keep only known selling fields that actually have a value.
  const hidden = Array.isArray(body.hiddenPrices) ? body.hiddenPrices : [];
  data.hiddenPrices = SELLING_KEYS.filter((k) => hidden.includes(k) && data[k] !== null && data[k] !== undefined);

  if (!Object.keys(fields).some((k) => SELLING_KEYS.includes(k))) {
    const withValue = SELLING_KEYS.filter((k) => data[k] !== null);
    if (withValue.length === 0) fields.sellingPrices = AT_LEAST_ONE_PRICE;
    else if (withValue.every((k) => data.hiddenPrices.includes(k))) fields.sellingPrices = AT_LEAST_ONE_VISIBLE;
  }

  data.isAvailable = body.isAvailable === undefined ? true : body.isAvailable === true;

  if (Object.keys(fields).length) {
    throw badRequest('ફોર્મમાં કેટલીક માહિતી સુધારો.', fields);
  }
  return data;
}

export function validateCategoryInput(body = {}) {
  const nameGujarati = cleanString(body.nameGujarati, 60);
  if (!nameGujarati) {
    throw badRequest('કેટેગરીનું ગુજરાતી નામ લખો.', { nameGujarati: 'કેટેગરીનું ગુજરાતી નામ લખો.' });
  }
  return { nameGujarati, nameEnglish: cleanString(body.nameEnglish, 60) };
}

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
