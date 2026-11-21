// Formatting helpers. Numbers use Latin digits (as on most shop boards in Gujarat).
const LOCALE = 'gu-IN-u-nu-latn';

const priceFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `₹${priceFormatter.format(value)}`;
}

export const hasPrice = (value) => value !== null && value !== undefined && value !== '';

export function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

/** Short, friendly Gujarati relative time: "હમણાં", "5 મિનિટ પહેલાં", "ગઈકાલે" … */
export function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'હમણાં';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} મિનિટ પહેલાં`;
  const hours = Math.floor(min / 60);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (d >= startOfToday) return `${hours} કલાક પહેલાં`;
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  if (d >= startOfYesterday) return `ગઈકાલે ${formatTime(d)}`;
  const days = Math.ceil((startOfToday - d) / 86400000);
  if (days < 7) return `${days} દિવસ પહેલાં`;
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

/** Convert a number/null from the API into an input string. */
export const toInput = (value) => (hasPrice(value) ? String(value) : '');
