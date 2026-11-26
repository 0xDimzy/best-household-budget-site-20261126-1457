// Formatting helpers: money and dates, kept in one place so every page
// renders the same figures the same way.

export function money(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function money2(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(part, whole) {
  if (!whole) return 0;
  return (part / whole) * 100;
}

// Escape text that came from a user-editable field before it is placed in HTML.
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// "2026-11-27" -> "Nov 2026". Used by the savings-goal projections.
export function monthLabel(isoDate) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(isoDate + 'T00:00:00');
  return months[d.getMonth()] + ' ' + d.getFullYear();
}
