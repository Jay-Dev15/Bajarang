// API integration tests. Uses a real MongoDB (default: local test database,
// override with TEST_MONGODB_URI). The test database is dropped before and after.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/bajarang_test';
const config = {
  appPin: '4321',
  authSecret: 'x'.repeat(40),
  tokenTtlDays: 1,
  clientOrigins: ['http://localhost:5173'],
};

let server;
let base;
let token;

async function api(method, path, body, { auth = true } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  server = createApp(config).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('rejects data access without PIN token', async () => {
  const r = await api('GET', '/products', undefined, { auth: false });
  assert.equal(r.status, 401);
  assert.equal(r.body.success, false);
  const w = await api('POST', '/products', { nameGujarati: 'x' }, { auth: false });
  assert.equal(w.status, 401);
  const bad = await fetch(base + '/products', { headers: { Authorization: 'Bearer v1.9999999999999.forged' } });
  assert.equal(bad.status, 401);
});

test('wrong PIN is rejected, correct PIN returns token', async () => {
  const wrong = await api('POST', '/auth/login', { pin: '0000' }, { auth: false });
  assert.equal(wrong.status, 401);
  const right = await api('POST', '/auth/login', { pin: '4321' }, { auth: false });
  assert.equal(right.status, 200);
  assert.ok(right.body.data.token);
  token = right.body.data.token;
  const check = await api('GET', '/auth/check');
  assert.equal(check.status, 200);
});

let vegId;
let productId;

test('category create, duplicate, update, status', async () => {
  const c = await api('POST', '/categories', { nameGujarati: 'શાકભાજી', nameEnglish: 'Vegetables' });
  assert.equal(c.status, 201);
  vegId = c.body.data._id;

  const dup = await api('POST', '/categories', { nameGujarati: 'શાકભાજી' });
  assert.equal(dup.status, 409);

  const empty = await api('POST', '/categories', { nameGujarati: '  ' });
  assert.equal(empty.status, 400);

  const u = await api('PUT', `/categories/${vegId}`, { nameGujarati: 'શાકભાજી', nameEnglish: 'Veg' });
  assert.equal(u.body.data.nameEnglish, 'Veg');

  const s = await api('PATCH', `/categories/${vegId}/status`, { isActive: false });
  assert.equal(s.body.data.isActive, false);
  await api('PATCH', `/categories/${vegId}/status`, { isActive: true });
});

test('product create with validation and no history on create', async () => {
  const invalid = await api('POST', '/products', { nameGujarati: '', sellingPrice1kg: 'abc' });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.error.fields.nameGujarati);
  assert.ok(invalid.body.error.fields.sellingPrice1kg);

  const p = await api('POST', '/products', {
    nameGujarati: 'ટામેટાં',
    nameEnglish: 'Tomato',
    categoryId: vegId,
    purchasePricePerKg: 20,
    sellingPrice250g: 8,
    sellingPrice500g: '15',
    sellingPrice1kg: 30,
  });
  assert.equal(p.status, 201);
  assert.equal(p.body.data.sellingPrice500g, 15);
  assert.equal(p.body.data.isAvailable, true);
  productId = p.body.data._id;

  const h = await api('GET', `/products/${productId}/history`);
  assert.equal(h.body.data.length, 0);
});

test('search, category and availability filters', async () => {
  await api('POST', '/products', { nameGujarati: 'બટાકા', nameEnglish: 'Potato', sellingPrice1kg: 30, isAvailable: false });

  const byGu = await api('GET', `/products?search=${encodeURIComponent('ટામે')}`);
  assert.deepEqual(byGu.body.data.map((p) => p.nameEnglish), ['Tomato']);

  const byEn = await api('GET', '/products?search=pota');
  assert.deepEqual(byEn.body.data.map((p) => p.nameGujarati), ['બટાકા']);

  const byCat = await api('GET', `/products?category=${vegId}`);
  assert.equal(byCat.body.data.length, 1);

  const out = await api('GET', '/products?availability=unavailable');
  assert.deepEqual(out.body.data.map((p) => p.nameGujarati), ['બટાકા']);

  const regexSafe = await api('GET', `/products?search=${encodeURIComponent('(.*')}`);
  assert.equal(regexSafe.status, 200);
});

test('updating prices records history; non-price edit does not', async () => {
  const before = await api('GET', `/products/${productId}`);
  await new Promise((r) => setTimeout(r, 10));

  const nameOnly = await api('PUT', `/products/${productId}`, {
    ...before.body.data,
    nameEnglish: 'Tomatoes',
    updatedBy: 'વલ્લભભાઈ',
  });
  assert.equal(nameOnly.status, 200);
  assert.equal(nameOnly.body.data.priceHistoryRecorded, false);
  assert.ok(new Date(nameOnly.body.data.product.updatedAt) > new Date(before.body.data.updatedAt));

  const priced = await api('PUT', `/products/${productId}`, {
    ...nameOnly.body.data.product,
    sellingPrice1kg: 32,
    sellingPrice250g: '',
    updatedBy: 'નારણભાઈ',
  });
  assert.equal(priced.body.data.priceHistoryRecorded, true);
  assert.equal(priced.body.data.product.sellingPrice250g, null);
  assert.equal(priced.body.data.product.lastUpdatedBy, 'નારણભાઈ');

  const h = await api('GET', `/products/${productId}/history`);
  assert.equal(h.body.data.length, 1);
  const [entry] = h.body.data;
  assert.equal(entry.previousSellingPrice1kg, 30);
  assert.equal(entry.newSellingPrice1kg, 32);
  assert.equal(entry.previousSellingPrice250g, 8);
  assert.equal(entry.newSellingPrice250g, null);
  assert.equal(entry.updatedBy, 'નારણભાઈ');
});

test('piece-only and 100g prices; at least one selling price required', async () => {
  const none = await api('POST', '/products', { nameGujarati: 'ખાલી', purchasePricePerKg: 10 });
  assert.equal(none.status, 400);
  assert.ok(none.body.error.fields.sellingPrices);

  const lemon = await api('POST', '/products', { nameGujarati: 'લીંબુ', sellingPricePerPiece: 10 });
  assert.equal(lemon.status, 201);
  assert.equal(lemon.body.data.sellingPricePerPiece, 10);
  assert.equal(lemon.body.data.sellingPrice1kg, null);

  const rice = await api('POST', '/products', { nameGujarati: 'ચોખા', sellingPrice100g: 20 });
  assert.equal(rice.body.data.sellingPrice100g, 20);

  const upd = await api('PUT', `/products/${lemon.body.data._id}`, {
    ...lemon.body.data,
    sellingPricePerPiece: 8,
    updatedBy: 'જયદીપ',
  });
  assert.equal(upd.body.data.priceHistoryRecorded, true);
  const [h] = (await api('GET', `/products/${lemon.body.data._id}/history`)).body.data;
  assert.equal(h.previousSellingPricePerPiece, 10);
  assert.equal(h.newSellingPricePerPiece, 8);
  assert.equal(h.updatedBy, 'જયદીપ');

  // Clearing every selling price on update is rejected too.
  const cleared = await api('PUT', `/products/${rice.body.data._id}`, { ...rice.body.data, sellingPrice100g: '' });
  assert.equal(cleared.status, 400);

  await api('DELETE', `/products/${lemon.body.data._id}`);
  await api('DELETE', `/products/${rice.body.data._id}`);
});

test('hidden prices stay saved but are listed in hiddenPrices; one must stay visible', async () => {
  const p = await api('POST', '/products', {
    nameGujarati: 'કોબીજ',
    sellingPrice250g: 10,
    sellingPricePerPiece: 25,
    hiddenPrices: ['sellingPrice250g', 'sellingPrice1kg', 'nonsense'],
  });
  assert.equal(p.status, 201);
  assert.equal(p.body.data.sellingPrice250g, 10); // value kept
  assert.deepEqual(p.body.data.hiddenPrices, ['sellingPrice250g']); // empty/unknown keys dropped

  const allHidden = await api('PUT', `/products/${p.body.data._id}`, {
    ...p.body.data,
    hiddenPrices: ['sellingPrice250g', 'sellingPricePerPiece'],
  });
  assert.equal(allHidden.status, 400);
  assert.ok(allHidden.body.error.fields.sellingPrices);

  const shown = await api('PUT', `/products/${p.body.data._id}`, { ...p.body.data, hiddenPrices: [] });
  assert.deepEqual(shown.body.data.product.hiddenPrices, []);
  assert.equal(shown.body.data.priceHistoryRecorded, false); // show/hide is not a price change
  await api('DELETE', `/products/${p.body.data._id}`);
});

test('availability toggle keeps prices', async () => {
  const r = await api('PATCH', `/products/${productId}/availability`, { isAvailable: false });
  assert.equal(r.body.data.isAvailable, false);
  assert.equal(r.body.data.sellingPrice1kg, 32);
  const bad = await api('PATCH', `/products/${productId}/availability`, { isAvailable: 'no' });
  assert.equal(bad.status, 400);
});

test('category with products cannot be deleted; counts are returned', async () => {
  const list = await api('GET', '/categories');
  assert.equal(list.body.data.find((c) => c._id === vegId).productCount, 1);
  const del = await api('DELETE', `/categories/${vegId}`);
  assert.equal(del.status, 409);

  const empty = await api('POST', '/categories', { nameGujarati: 'અન્ય' });
  const ok = await api('DELETE', `/categories/${empty.body.data._id}`);
  assert.equal(ok.status, 200);
});

test('invalid and unknown ids return 404, delete removes product and history', async () => {
  assert.equal((await api('GET', '/products/not-an-id')).status, 404);
  assert.equal((await api('GET', '/products/64b7f0000000000000000000')).status, 404);
  const del = await api('DELETE', `/products/${productId}`);
  assert.equal(del.status, 200);
  assert.equal((await api('GET', `/products/${productId}`)).status, 404);
  const count = await mongoose.connection.collection('pricehistories').countDocuments({});
  assert.equal(count, 0);
});

test('purchase list: default sources, add, tick/cross, edit, rename source, delete', async () => {
  const unauth = await api('GET', '/purchase', undefined, { auth: false });
  assert.equal(unauth.status, 401);

  const first = await api('GET', '/purchase');
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.data.sources.map((s) => s.name), ['માર્કેટ', 'બારડી', 'હરભોલે', 'અન્ય']);
  const [market, baradi] = first.body.data.sources;

  const empty = await api('POST', '/purchase/items', { name: ' ', sourceId: market._id });
  assert.equal(empty.status, 400);
  const badSource = await api('POST', '/purchase/items', { name: 'બટાકા', sourceId: 'nope' });
  assert.equal(badSource.status, 400);

  const item = await api('POST', '/purchase/items', { name: 'બટાકા', sourceId: market._id, updatedBy: 'જયદીપ' });
  assert.equal(item.status, 201);
  assert.equal(item.body.data.needed, true);
  const id = item.body.data._id;

  const cross = await api('PATCH', `/purchase/items/${id}/needed`, { needed: false, updatedBy: 'નારણભાઈ' });
  assert.equal(cross.body.data.needed, false);
  assert.equal(cross.body.data.lastUpdatedBy, 'નારણભાઈ');
  const tick = await api('PATCH', `/purchase/items/${id}/needed`, { needed: true });
  assert.equal(tick.body.data.needed, true);
  assert.equal((await api('PATCH', `/purchase/items/${id}/needed`, { needed: 'yes' })).status, 400);

  const edited = await api('PUT', `/purchase/items/${id}`, { name: '10 કિલો બટાકા', sourceId: baradi._id });
  assert.equal(edited.body.data.name, '10 કિલો બટાકા');
  assert.equal(edited.body.data.sourceId, baradi._id);

  const renamed = await api('PUT', `/purchase/sources/${baradi._id}`, { name: 'બારડી માર્કેટ' });
  assert.equal(renamed.body.data.name, 'બારડી માર્કેટ');
  const dup = await api('POST', '/purchase/sources', { name: 'માર્કેટ' });
  assert.equal(dup.status, 409);
  const added = await api('POST', '/purchase/sources', { name: 'ડેરી' });
  assert.equal(added.status, 201);

  // Inline edit: name only (place unchanged), and saving puts it back in "to buy".
  await api('PATCH', `/purchase/items/${id}/needed`, { needed: false });
  const inline = await api('PUT', `/purchase/items/${id}`, { name: '5 કિલો બટાકા', needed: true });
  assert.equal(inline.status, 200);
  assert.equal(inline.body.data.name, '5 કિલો બટાકા');
  assert.equal(inline.body.data.sourceId, baradi._id);
  assert.equal(inline.body.data.needed, true);

  const after = await api('GET', '/purchase');
  assert.equal(after.body.data.items.length, 1);
  assert.equal(after.body.data.sources.at(-1).name, 'ડેરી');

  assert.equal((await api('DELETE', `/purchase/items/${id}`)).status, 200);
  assert.equal((await api('DELETE', `/purchase/items/${id}`)).status, 404);
  assert.equal((await api('GET', '/purchase')).body.data.items.length, 0);
});

test('bootstrap returns products and categories with counts in one request', async () => {
  const cat = await api('POST', '/categories', { nameGujarati: 'કઠોળ' });
  const catId = cat.body.data._id;
  for (const name of ['મગ', 'ચણા', 'અડદ']) {
    await api('POST', '/products', { nameGujarati: name, categoryId: catId, sellingPrice1kg: 100 });
  }
  const r = await api('GET', '/bootstrap');
  assert.equal(r.status, 200);
  const { products, categories } = r.body.data;
  assert.ok(products.length >= 3);
  assert.equal(products[0].__v, undefined); // slim payload
  assert.equal(products[0].lastUpdatedBy, undefined);
  assert.equal(categories.find((c) => c._id === catId).productCount, 3);
  assert.equal((await api('GET', '/bootstrap', undefined, { auth: false })).status, 401);
});

test('product list pagination: page, limit, total, hasMore', async () => {
  const all = (await api('GET', '/products')).body;
  assert.equal(all.meta, undefined); // no limit -> plain full list
  const total = all.data.length;

  const p1 = (await api('GET', '/products?limit=2&page=1')).body;
  assert.equal(p1.data.length, 2);
  assert.deepEqual(p1.meta, { page: 1, limit: 2, total, hasMore: total > 2 });

  const last = Math.ceil(total / 2);
  const pl = (await api('GET', `/products?limit=2&page=${last}`)).body;
  assert.equal(pl.meta.hasMore, false);
  assert.deepEqual(
    [...p1.data, ...pl.data].map((p) => p._id).slice(0, 2),
    all.data.slice(0, 2).map((p) => p._id)
  );

  const capped = (await api('GET', '/products?limit=999')).body;
  assert.equal(capped.meta.limit, 100);
});
