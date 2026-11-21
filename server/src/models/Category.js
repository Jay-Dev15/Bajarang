import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    nameGujarati: { type: String, required: true, trim: true, maxlength: 60 },
    nameEnglish: { type: String, trim: true, maxlength: 60, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevents two categories with the same Gujarati name (case-insensitive for English letters).
categorySchema.index({ nameGujarati: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Category', categorySchema);
