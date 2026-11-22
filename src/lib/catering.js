// Shared labels and helpers for the catering order module.

export const TIME_SLOTS = { MORNING: "בוקר", LUNCH: "צהריים", AFTERNOON: "אחר הצהריים" };

export const ORDER_STATUS = {
  link_created: { label: "ממתין ללקוח", className: "bg-slate-100 text-slate-700" },
  submitted: { label: "ממתין לאישור", className: "bg-amber-100 text-amber-800" },
  approved: { label: "אושר", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "בוטל", className: "bg-red-100 text-red-700" },
};

export const CATEGORY_LABELS = { STARTER: "פתיחה", MAIN: "עיקרי", DESSERT: "קינוח", DRINK: "שתייה", OTHER: "נוסף" };

// Option groups of a personal-dishes menu (same keys as in AIO)
export const DINER_GROUPS = [
  ["main", "מנה עיקרית"],
  ["serving", "הגשה"],
  ["additions", "תוספות"],
  ["drink", "שתייה"],
];

export const money = (n) => `₪${Number(n || 0).toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;

export const lineKey = (menuId, itemId) => `${menuId}|${itemId || ""}`;

export const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

export const orderLink = (token) => `${window.location.origin}/catering-order/${token}`;

export function newToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Estimated total in the browser (the server recomputes the real one on submit).
export function estimate(cart, suppliers) {
  const menus = new Map();
  const items = new Map();
  for (const s of suppliers) for (const m of s.menus) {
    menus.set(m.id, { ...m, supplier: s });
    for (const i of m.items) items.set(i.id, i);
  }
  const used = new Set();
  let total = 0;
  let count = 0;
  for (const line of Object.values(cart)) {
    const m = menus.get(line.menu_id);
    if (!m || !(line.quantity > 0)) continue;
    const unit = m.pricing_model === "per_person" ? Number(m.price_per_diner) || 0 : Number(items.get(line.item_id)?.price) || 0;
    total += unit * line.quantity;
    count += 1;
    used.add(m.supplier.id);
  }
  let delivery = 0;
  for (const s of suppliers) if (used.has(s.id) && s.delivery_fee) delivery += Number(s.delivery_fee);
  return { total: total + delivery, delivery, count, suppliersUsed: used };
}
