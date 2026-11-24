// Quotes a CSV cell and neutralizes spreadsheet formulas (=, +, -, @, tab, CR) so Excel shows them as text.
export const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};