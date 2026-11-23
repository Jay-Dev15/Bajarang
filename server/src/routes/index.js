import { Router } from 'express';
import * as products from '../controllers/productController.js';
import * as categories from '../controllers/categoryController.js';
import * as purchase from '../controllers/purchaseController.js';
import { getBootstrap } from '../controllers/bootstrapController.js';
import { makeAuthController } from '../controllers/authController.js';
import { requireAuth, loginRateLimit } from '../middleware/auth.js';

export function buildRouter(config) {
  const router = Router();
  const auth = makeAuthController(config);
  const protect = requireAuth(config);

  router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

  router.post('/auth/login', loginRateLimit(), auth.login);
  router.get('/auth/check', protect, auth.check);

  // Every data route requires the shared PIN token: prices (including
  // purchase prices) are private shop information.
  router.use(protect);

  router.get('/bootstrap', getBootstrap);
  router.get('/products', products.listProducts);
  router.post('/products', products.createProduct);
  router.get('/products/:id', products.getProduct);
  router.put('/products/:id', products.updateProduct);
  router.delete('/products/:id', products.deleteProduct);
  router.patch('/products/:id/availability', products.setAvailability);
  router.get('/products/:id/history', products.getProductHistory);

  router.get('/categories', categories.listCategories);
  router.post('/categories', categories.createCategory);
  router.put('/categories/:id', categories.updateCategory);
  router.patch('/categories/:id/status', categories.setCategoryStatus);
  router.delete('/categories/:id', categories.deleteCategory);

  // Shared daily purchase list. Items are deleted only from the inline edit row.
  router.get('/purchase', purchase.getPurchaseList);
  router.post('/purchase/sources', purchase.createSource);
  router.put('/purchase/sources/:id', purchase.renameSource);
  router.post('/purchase/items', purchase.createItem);
  router.put('/purchase/items/:id', purchase.updateItem);
  router.patch('/purchase/items/:id/needed', purchase.setNeeded);
  router.delete('/purchase/items/:id', purchase.deleteItem);

  return router;
}
