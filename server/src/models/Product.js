import mongoose from 'mongoose';

// All prices are stored in INR. null means "not set" (e.g. a packet item without a 250g price).
const price = { type: Number, min: 0, default: null };

const productSchema = new mongoose.Schema(
  {
    nameGujarati: { type: String, required: true, trim: true, maxlength: 80 },
    nameEnglish: { type: String, trim: true, maxlength: 80, default: '' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    purchasePricePerKg: price,
    sellingPrice100g: price,
    sellingPrice250g: price,
    sellingPrice500g: price,
    sellingPrice1kg: price,
    sellingPricePerPiece: price,
    // Selling-price fields that stay saved but are NOT shown in the price list.
    hiddenPrices: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    // Optional label of who made the last change. Not a verified identity.
    lastUpdatedBy: { type: String, trim: true, maxlength: 40, default: '' },
    // Marks records created by the seed script so they are identifiable and removable.
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ updatedAt: -1 });
// Price list: stock filter + Gujarati name order (collation must match the query).
productSchema.index({ isAvailable: 1, nameGujarati: 1 }, { collation: { locale: 'gu' } });

export const SELLING_PRICE_FIELDS = [
  'sellingPrice100g',
  'sellingPrice250g',
  'sellingPrice500g',
  'sellingPrice1kg',
  'sellingPricePerPiece',
];
export const PRICE_FIELDS = ['purchasePricePerKg', ...SELLING_PRICE_FIELDS];

/** "sellingPrice250g" -> "SellingPrice250g", used for PriceHistory field names. */
export const capitalize = (field) => field[0].toUpperCase() + field.slice(1);

export default mongoose.model('Product', productSchema);
