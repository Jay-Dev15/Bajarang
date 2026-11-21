import mongoose from 'mongoose';

// One line in the shared purchase list. Items are never deleted:
// needed = true  -> ✓ buy it
// needed = false -> ✗ not needed now
const purchaseItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseSource', required: true },
    needed: { type: Boolean, default: true },
    // Optional label of who changed it last (not a verified identity).
    lastUpdatedBy: { type: String, trim: true, maxlength: 40, default: '' },
  },
  { timestamps: true }
);

purchaseItemSchema.index({ sourceId: 1 });

export default mongoose.model('PurchaseItem', purchaseItemSchema);
