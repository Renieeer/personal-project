// Dates are stored as YYYY-MM-DD; format them in UTC so they never shift a day.
const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateTime = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

const parseDate = (value) => (value ? new Date(`${value}T00:00:00Z`) : null);

export const formatMonthYear = (value) => (value ? monthYear.format(parseDate(value)) : '');
export const formatDate = (value) => (value ? fullDate.format(parseDate(value)) : '');
export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : '');

export function dateRange(start, end, isCurrent, present = 'Present') {
  const to = isCurrent ? present : formatMonthYear(end);
  return [formatMonthYear(start), to].filter(Boolean).join(' – ');
}

export function yearRange(start, end, present = 'Present') {
  if (start && end) return start === end ? String(start) : `${start} – ${end}`;
  if (start) return `${start} – ${present}`;
  return end ? String(end) : '';
}

export function paragraphs(text) {
  return (text || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

// Picks black or white text for the best contrast on a hex background.
export function readableTextOn(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!match) return '#ffffff';
  const n = parseInt(match[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? '#111111' : '#ffffff';
}

export const pad = (n) => String(n).padStart(2, '0');
