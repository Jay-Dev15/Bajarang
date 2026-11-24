// Operator names are only labels shown in history. They are NOT verified logins.
export const OPERATORS = ['નારણભાઈ', 'વલ્લભભાઈ', 'જયદીપ'];

export const SORT_OPTIONS = [
  { value: 'name', label: 'નામ (ક → જ્ઞ)' },
  { value: '-name', label: 'નામ (જ્ઞ → ક)' },
  { value: 'updated', label: 'છેલ્લે બદલાયેલ પહેલાં' },
];

// In stock is the default view; there is no "all" option.
export const STATUS_FILTERS = [
  { value: 'available', label: 'સ્ટોકમાં' },
  { value: 'unavailable', label: 'સ્ટોક નથી' },
];

// Weight-based selling prices, smallest first. `grams` drives the auto-fill in the form.
export const WEIGHT_PRICES = [
  { key: 'sellingPrice100g', label: '100 ગ્રામ', grams: 100 },
  { key: 'sellingPrice250g', label: '250 ગ્રામ', grams: 250 },
  { key: 'sellingPrice500g', label: '500 ગ્રામ', grams: 500 },
  { key: 'sellingPrice1kg', label: '1 કિલો', grams: 1000 },
];

export const PIECE_PRICE = { key: 'sellingPricePerPiece', label: '1 નંગ' };

// Every selling price, in the order shown on the price card.
export const PRICE_FIELDS = [...WEIGHT_PRICES, PIECE_PRICE];
