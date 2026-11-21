// Client-side search, filtering and sorting. The full list is small (a few hundred
// items at most), so filtering in the browser gives instant results while typing.

const collator = new Intl.Collator('gu', { sensitivity: 'base' });

export function normalize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSearch(product, query) {
  const q = normalize(query);
  if (!q) return true;
  const gu = normalize(product.nameGujarati);
  const en = normalize(product.nameEnglish);
  // Also match ignoring spaces, so "લાલમરચું" finds "લાલ મરચું".
  const qNoSpace = q.replace(/ /g, '');
  return gu.includes(q) || en.includes(q) || gu.replace(/ /g, '').includes(qNoSpace) || en.replace(/ /g, '').includes(qNoSpace);
}

export function filterProducts(products, { search = '', category = '', status = '', sort = 'name' } = {}) {
  const q = normalize(search);
  const list = products.filter((p) => {
    if (category === 'none' ? p.categoryId : category && p.categoryId !== category) return false;
    if (status === 'available' && !p.isAvailable) return false;
    if (status === 'unavailable' && p.isAvailable) return false;
    return matchesSearch(p, q);
  });

  const sorted = [...list];
  if (sort === 'updated') {
    sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else {
    const dir = sort === '-name' ? -1 : 1;
    sorted.sort((a, b) => dir * collator.compare(a.nameGujarati, b.nameGujarati));
  }

  // When searching, show names that START with the query first.
  if (q) {
    const starts = (p) => normalize(p.nameGujarati).startsWith(q) || normalize(p.nameEnglish).startsWith(q);
    sorted.sort((a, b) => Number(starts(b)) - Number(starts(a)));
  }
  return sorted;
}

export const sortCategories = (categories) =>
  [...categories].sort((a, b) => collator.compare(a.nameGujarati, b.nameGujarati));
