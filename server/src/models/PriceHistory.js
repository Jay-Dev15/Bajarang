import mongoose from 'mongoose';
import { PRICE_FIELDS, capitalize } from './Product.js';

const price = { type: Number, default: null };

// For every price field there is a previous… and new… value, e.g.
// previousSellingPrice250g / newSellingPrice250g.
const priceColumns = Object.fromEntries(
  PRICE_FIELDS.flatMap((f) => [
    [`previous${capitalize(f)}`, price],
    [`new${capitalize(f)}`, price],
  ])
);

const priceHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  ...priceColumns,
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, trim: true, maxlength: 40, default: '' },
});

priceHistorySchema.index({ productId: 1, updatedAt: -1 });

export default mongoose.model('PriceHistory', priceHistorySchema, 'pricehistories');
