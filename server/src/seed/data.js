// Sample data for trying the app. Prices are examples, NOT real shop prices.
// Products created from this file are saved with isSample: true.

export const categories = [
  { nameGujarati: 'શાકભાજી', nameEnglish: 'Vegetables' },
  { nameGujarati: 'કરિયાણા', nameEnglish: 'Groceries' },
  { nameGujarati: 'મસાલા', nameEnglish: 'Spices' },
  { nameGujarati: 'દાળ', nameEnglish: 'Pulses' },
  { nameGujarati: 'તેલ', nameEnglish: 'Oils' },
  { nameGujarati: 'ઘરવખરી', nameEnglish: 'Household' },
  { nameGujarati: 'સફાઈ સામગ્રી', nameEnglish: 'Cleaning Materials' },
  { nameGujarati: 'અન્ય', nameEnglish: 'Others' },
];

const _ = null; // price not used for this item

// [nameGujarati, nameEnglish, category, purchase/kg, 100g, 250g, 500g, 1kg, 1 piece, isAvailable]
const rows = [
  ['ટામેટાં', 'Tomato', 'શાકભાજી', 20, _, 8, 15, 30, _, true],
  ['બટાકા', 'Potato', 'શાકભાજી', 14, _, _, _, 20, _, true],
  ['ડુંગળી', 'Onion', 'શાકભાજી', 45, _, 20, 35, 60, _, true], // discounted on bigger quantity
  ['લીંબુ', 'Lemon', 'શાકભાજી', _, _, _, _, _, 10, true],
  ['લસણ', 'Garlic', 'શાકભાજી', 120, 15, 40, 75, 150, _, true],
  ['આદુ', 'Ginger', 'શાકભાજી', 80, 10, 25, 50, 100, _, true],
  ['લીલાં મરચાં', 'Green Chilli', 'શાકભાજી', 40, 6, 15, 30, 60, _, true],
  ['ધાણા', 'Coriander', 'શાકભાજી', 60, 10, 20, 40, 80, _, true],
  ['રીંગણ', 'Brinjal', 'શાકભાજી', 25, _, 10, 20, 40, _, true],
  ['ભીંડા', 'Okra', 'શાકભાજી', 40, _, 15, 30, 60, _, false],
  ['કોબીજ', 'Cabbage', 'શાકભાજી', 20, _, _, _, 30, 25, true],
  ['નાળિયેર', 'Coconut', 'શાકભાજી', _, _, _, _, _, 40, true],
  ['જીરું', 'Cumin', 'મસાલા', 280, 35, 90, 170, 340, _, true],
  ['હળદર', 'Turmeric', 'મસાલા', 180, 25, 60, 110, 220, _, true],
  ['લાલ મરચું પાવડર', 'Red Chilli Powder', 'મસાલા', 220, 30, 70, 140, 280, _, true],
  ['ધાણાજીરું', 'Coriander Cumin Powder', 'મસાલા', 200, 25, 65, 125, 250, _, true],
  ['ખાંડ', 'Sugar', 'કરિયાણા', 40, _, 12, 23, 45, _, true],
  ['ચોખા', 'Rice', 'કરિયાણા', 150, 20, _, _, _, _, true],
  ['ઘઉં', 'Wheat', 'કરિયાણા', 30, _, 10, 18, 36, _, true],
  ['ગોળ', 'Jaggery', 'કરિયાણા', 50, _, 16, 30, 60, _, true],
  ['તુવેર દાળ', 'Toor Dal', 'દાળ', 130, _, 40, 75, 150, _, true],
  ['મગ દાળ', 'Moong Dal', 'દાળ', 110, _, 35, 65, 125, _, true],
  ['ચણા દાળ', 'Chana Dal', 'દાળ', 80, _, 25, 48, 95, _, false],
  ['સીંગતેલ', 'Groundnut Oil', 'તેલ', 170, _, 50, 95, 185, _, true],
  ['કપાસિયા તેલ', 'Cottonseed Oil', 'તેલ', 130, _, _, 75, 145, _, true],
];

export const products = rows.map(([nameGujarati, nameEnglish, category, buy, p100, p250, p500, p1kg, piece, isAvailable]) => ({
  nameGujarati,
  nameEnglish,
  category,
  purchasePricePerKg: buy,
  sellingPrice100g: p100,
  sellingPrice250g: p250,
  sellingPrice500g: p500,
  sellingPrice1kg: p1kg,
  sellingPricePerPiece: piece,
  isAvailable,
}));
