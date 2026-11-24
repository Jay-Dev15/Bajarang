import { ok } from '../utils/ApiError.js';
import { findAllProducts } from './productController.js';
import { findAllCategories } from './categoryController.js';

// GET /api/bootstrap -> { products, categories }
// Everything the app needs on open, in ONE request (one cold start, one DB
// round trip pair). Category product counts are worked out from the products
// already loaded instead of running a separate aggregate query.
export async function getBootstrap(_req, res) {
  const [products, categories] = await Promise.all([findAllProducts(), findAllCategories()]);
  const counts = new Map();
  for (const p of products) {
    const key = String(p.categoryId);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  ok(res, {
    products,
    categories: categories.map((c) => ({ ...c, productCount: counts.get(String(c._id)) || 0 })),
  });
}
