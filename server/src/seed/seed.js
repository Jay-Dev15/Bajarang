/**
 * Seed sample categories and products.
 *
 *   npm run seed                      -> add missing sample data (safe to run many times)
 *   npm run seed -- --remove-samples  -> delete all sample products (isSample: true)
 *
 * Existing records are never overwritten: categories are matched by Gujarati name,
 * sample products by Gujarati name + isSample flag.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import PriceHistory from '../models/PriceHistory.js';
import { categories, products } from './data.js';

dotenv.config({ quiet: true });

async function removeSamples() {
  const samples = await Product.find({ isSample: true }, { _id: 1 }).lean();
  const ids = samples.map((s) => s._id);
  await PriceHistory.deleteMany({ productId: { $in: ids } });
  const { deletedCount } = await Product.deleteMany({ _id: { $in: ids } });
  console.log(`Removed ${deletedCount} sample products. Categories were kept.`);
}

async function seed() {
  await Category.init(); // make sure the unique index exists before upserting

  const categoryIds = {};
  let newCategories = 0;
  for (const c of categories) {
    const result = await Category.findOneAndUpdate(
      { nameGujarati: c.nameGujarati },
      { $setOnInsert: { ...c, isActive: true } },
      { upsert: true, returnDocument: 'after', includeResultMetadata: true }
    );
    categoryIds[c.nameGujarati] = result.value._id;
    if (!result.lastErrorObject?.updatedExisting) newCategories += 1;
  }

  let newProducts = 0;
  for (const { category, ...p } of products) {
    const result = await Product.updateOne(
      { nameGujarati: p.nameGujarati, isSample: true },
      { $setOnInsert: { ...p, categoryId: categoryIds[category], isSample: true, lastUpdatedBy: '' } },
      { upsert: true, timestamps: true }
    );
    if (result.upsertedCount) newProducts += 1;
  }

  console.log(`Categories: ${newCategories} added, ${categories.length - newCategories} already existed.`);
  console.log(`Sample products: ${newProducts} added, ${products.length - newProducts} already existed.`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Copy .env.example to .env first.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected to database "${mongoose.connection.name}"`);

  if (process.argv.includes('--remove-samples')) await removeSamples();
  else await seed();

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
