import Product, { PRICE_FIELDS, capitalize } from '../models/Product.js';
import Category from '../models/Category.js';
import PriceHistory from '../models/PriceHistory.js';
import { ok, badRequest, notFound } from '../utils/ApiError.js';
import { validateProductInput, assertObjectId, isObjectId, cleanString, escapeRegex } from '../utils/validate.js';

const PRODUCT_NOT_FOUND = 'આ વસ્તુ મળી નથી.';
const GUJARATI_COLLATION = { locale: 'gu' };

const SORTS = {
  name: { nameGujarati: 1 },
  '-name': { nameGujarati: -1 },
  updated: { updatedAt: -1 },
};

async function assertCategoryExists(categoryId) {
  if (!categoryId) return;
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) throw badRequest('પસંદ કરેલી કેટેગરી મળી નથી.', { categoryId: 'પસંદ કરેલી કેટેગરી મળી નથી.' });
}

async function findProductOr404(id) {
  assertObjectId(id, PRODUCT_NOT_FOUND);
  const product = await Product.findById(id);
  if (!product) throw notFound(PRODUCT_NOT_FOUND);
  return product;
}

// GET /api/products?search=&category=&availability=available|unavailable&sort=name|-name|updated
export async function listProducts(req, res) {
  const { search, category, availability, sort } = req.query;
  const filter = {};

  const term = cleanString(search, 80);
  if (term) {
    const rx = new RegExp(escapeRegex(term), 'i');
    filter.$or = [{ nameGujarati: rx }, { nameEnglish: rx }];
  }
  if (category === 'none') filter.categoryId = null;
  else if (isObjectId(category)) filter.categoryId = category;

  if (availability === 'available') filter.isAvailable = true;
  else if (availability === 'unavailable') filter.isAvailable = false;

  const products = await Product.find(filter)
    .collation(GUJARATI_COLLATION)
    .sort(SORTS[sort] || SORTS.name)
    .lean();

  ok(res, products);
}

export async function getProduct(req, res) {
  const product = await findProductOr404(req.params.id);
  ok(res, product);
}

export async function createProduct(req, res) {
  const data = validateProductInput(req.body);
  await assertCategoryExists(data.categoryId);

  const product = await Product.create({
    ...data,
    lastUpdatedBy: cleanString(req.body.updatedBy, 40),
  });
  ok(res, product, 201);
}

export async function updateProduct(req, res) {
  const product = await findProductOr404(req.params.id);
  const data = validateProductInput(req.body);
  await assertCategoryExists(data.categoryId);
  const updatedBy = cleanString(req.body.updatedBy, 40);

  const previous = Object.fromEntries(PRICE_FIELDS.map((f) => [f, product[f] ?? null]));
  const pricesChanged = PRICE_FIELDS.some((f) => previous[f] !== (data[f] ?? null));

  product.set(data);
  product.lastUpdatedBy = updatedBy;
  // Ensure updatedAt moves even if nothing changed (user pressed "save" to confirm prices).
  product.updatedAt = new Date();
  await product.save();

  if (pricesChanged) {
    const columns = Object.fromEntries(
      PRICE_FIELDS.flatMap((f) => [
        [`previous${capitalize(f)}`, previous[f]],
        [`new${capitalize(f)}`, product[f] ?? null],
      ])
    );
    await PriceHistory.create({ productId: product._id, ...columns, updatedAt: product.updatedAt, updatedBy });
  }

  ok(res, { product, priceHistoryRecorded: pricesChanged });
}

export async function setAvailability(req, res) {
  if (typeof req.body?.isAvailable !== 'boolean') {
    throw badRequest('સ્ટોકની સ્થિતિ બરાબર નથી.');
  }
  const product = await findProductOr404(req.params.id);
  product.isAvailable = req.body.isAvailable;
  product.lastUpdatedBy = cleanString(req.body.updatedBy, 40);
  product.updatedAt = new Date();
  await product.save();
  ok(res, product);
}

export async function deleteProduct(req, res) {
  const product = await findProductOr404(req.params.id);
  await product.deleteOne();
  await PriceHistory.deleteMany({ productId: product._id });
  ok(res, { _id: product._id });
}

export async function getProductHistory(req, res) {
  const product = await findProductOr404(req.params.id);
  const history = await PriceHistory.find({ productId: product._id })
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();
  ok(res, history);
}
