import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { ok, badRequest, notFound, ApiError } from '../utils/ApiError.js';
import { validateCategoryInput, assertObjectId } from '../utils/validate.js';

const CATEGORY_NOT_FOUND = 'આ કેટેગરી મળી નથી.';
const DUPLICATE_MESSAGE = 'આ નામની કેટેગરી પહેલેથી છે.';

async function findCategoryOr404(id) {
  assertObjectId(id, CATEGORY_NOT_FOUND);
  const category = await Category.findById(id);
  if (!category) throw notFound(CATEGORY_NOT_FOUND);
  return category;
}

function rethrowDuplicate(err) {
  if (err?.code === 11000) {
    throw new ApiError(409, DUPLICATE_MESSAGE, { code: 'DUPLICATE', fields: { nameGujarati: DUPLICATE_MESSAGE } });
  }
  throw err;
}

/** All categories, sorted by Gujarati name (no counts). Used by /bootstrap. */
export const findAllCategories = () =>
  Category.find({}, { __v: 0 }).collation({ locale: 'gu' }).sort({ nameGujarati: 1 }).lean();

// GET /api/categories  -> categories with productCount, sorted by Gujarati name
export async function listCategories(_req, res) {
  const [categories, counts] = await Promise.all([
    Category.find().collation({ locale: 'gu' }).sort({ nameGujarati: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  ok(
    res,
    categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) || 0 }))
  );
}

export async function createCategory(req, res) {
  const data = validateCategoryInput(req.body);
  const category = await Category.create(data).catch(rethrowDuplicate);
  ok(res, { ...category.toObject(), productCount: 0 }, 201);
}

export async function updateCategory(req, res) {
  const category = await findCategoryOr404(req.params.id);
  category.set(validateCategoryInput(req.body));
  await category.save().catch(rethrowDuplicate);
  const productCount = await Product.countDocuments({ categoryId: category._id });
  ok(res, { ...category.toObject(), productCount });
}

export async function setCategoryStatus(req, res) {
  if (typeof req.body?.isActive !== 'boolean') throw badRequest('કેટેગરીની સ્થિતિ બરાબર નથી.');
  const category = await findCategoryOr404(req.params.id);
  category.isActive = req.body.isActive;
  await category.save();
  const productCount = await Product.countDocuments({ categoryId: category._id });
  ok(res, { ...category.toObject(), productCount });
}

// Deletion is only allowed for empty categories. Otherwise deactivate.
export async function deleteCategory(req, res) {
  const category = await findCategoryOr404(req.params.id);
  const productCount = await Product.countDocuments({ categoryId: category._id });
  if (productCount > 0) {
    throw new ApiError(
      409,
      `આ કેટેગરીમાં ${productCount} વસ્તુ છે, તેથી કાઢી શકાય નહીં. તેના બદલે બંધ કરો.`,
      { code: 'CATEGORY_NOT_EMPTY' }
    );
  }
  await category.deleteOne();
  ok(res, { _id: category._id });
}
