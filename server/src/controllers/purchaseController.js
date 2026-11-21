import PurchaseSource, { DEFAULT_SOURCES } from '../models/PurchaseSource.js';
import PurchaseItem from '../models/PurchaseItem.js';
import { ok, badRequest, notFound, ApiError } from '../utils/ApiError.js';
import { assertObjectId, cleanString, isObjectId } from '../utils/validate.js';

const ITEM_NOT_FOUND = 'આ વસ્તુ ખરીદી યાદીમાં મળી નથી.';
const SOURCE_NOT_FOUND = 'આ ખરીદીની જગ્યા મળી નથી.';
const DUPLICATE_SOURCE = 'આ નામની જગ્યા પહેલેથી છે.';

async function ensureDefaultSources() {
  if ((await PurchaseSource.estimatedDocumentCount()) > 0) return;
  await PurchaseSource.insertMany(
    DEFAULT_SOURCES.map((name, i) => ({ name, sortOrder: i })),
    { ordered: false }
  ).catch((err) => {
    if (err?.code !== 11000) throw err; // another request created them at the same time
  });
}

function readName(body, max, message) {
  const name = cleanString(body?.name, max);
  if (!name) throw badRequest(message, { name: message });
  return name;
}

async function assertSource(sourceId) {
  if (!isObjectId(sourceId) || !(await PurchaseSource.exists({ _id: sourceId }))) {
    throw badRequest('ક્યાંથી લેવાનું છે તે પસંદ કરો.', { sourceId: 'ક્યાંથી લેવાનું છે તે પસંદ કરો.' });
  }
}

function rethrowDuplicate(err) {
  if (err?.code === 11000) {
    throw new ApiError(409, DUPLICATE_SOURCE, { code: 'DUPLICATE', fields: { name: DUPLICATE_SOURCE } });
  }
  throw err;
}

async function findItemOr404(id) {
  assertObjectId(id, ITEM_NOT_FOUND);
  const item = await PurchaseItem.findById(id);
  if (!item) throw notFound(ITEM_NOT_FOUND);
  return item;
}

// GET /api/purchase -> { sources, items }
export async function getPurchaseList(_req, res) {
  await ensureDefaultSources();
  const [sources, items] = await Promise.all([
    PurchaseSource.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
    PurchaseItem.find().collation({ locale: 'gu' }).sort({ name: 1 }).lean(),
  ]);
  ok(res, { sources, items });
}

export async function createSource(req, res) {
  const name = readName(req.body, 40, 'જગ્યાનું નામ લખો.');
  const last = await PurchaseSource.findOne().sort({ sortOrder: -1 }).lean();
  const source = await PurchaseSource.create({ name, sortOrder: (last?.sortOrder ?? -1) + 1 }).catch(rethrowDuplicate);
  ok(res, source, 201);
}

export async function renameSource(req, res) {
  assertObjectId(req.params.id, SOURCE_NOT_FOUND);
  const source = await PurchaseSource.findById(req.params.id);
  if (!source) throw notFound(SOURCE_NOT_FOUND);
  source.name = readName(req.body, 40, 'જગ્યાનું નામ લખો.');
  await source.save().catch(rethrowDuplicate);
  ok(res, source);
}

export async function createItem(req, res) {
  const name = readName(req.body, 80, 'વસ્તુનું નામ લખો.');
  await assertSource(req.body.sourceId);
  const item = await PurchaseItem.create({
    name,
    sourceId: req.body.sourceId,
    needed: req.body.needed === undefined ? true : req.body.needed === true,
    lastUpdatedBy: cleanString(req.body.updatedBy, 40),
  });
  ok(res, item, 201);
}

// PUT /api/purchase/items/:id { name, sourceId }
export async function updateItem(req, res) {
  const item = await findItemOr404(req.params.id);
  item.name = readName(req.body, 80, 'વસ્તુનું નામ લખો.');
  await assertSource(req.body.sourceId);
  item.sourceId = req.body.sourceId;
  item.lastUpdatedBy = cleanString(req.body.updatedBy, 40);
  await item.save();
  ok(res, item);
}

// PATCH /api/purchase/items/:id/needed { needed }
export async function setNeeded(req, res) {
  if (typeof req.body?.needed !== 'boolean') throw badRequest('✓ કે ✗ પસંદ કરો.');
  const item = await findItemOr404(req.params.id);
  item.needed = req.body.needed;
  item.lastUpdatedBy = cleanString(req.body.updatedBy, 40);
  await item.save();
  ok(res, item);
}
