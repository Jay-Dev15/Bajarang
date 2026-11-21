import mongoose from 'mongoose';

// Where an item is bought from (e.g. માર્કેટ, બારડી, હરભોલે).
const purchaseSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

purchaseSourceSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const DEFAULT_SOURCES = ['માર્કેટ', 'બારડી', 'હરભોલે', 'અન્ય'];

export default mongoose.model('PurchaseSource', purchaseSourceSchema);
