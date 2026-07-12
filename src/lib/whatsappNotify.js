/**
 * whatsappNotify.js — בונה קישור wa.me עם הודעה מוכנה לדייר.
 * מופעל אוטומטית כשקריאה מחליפה סטטוס ל"בטיפול" או "הושלם".
 * ללא צורך במפתחות API — פותח את וואטסאפ עם הטקסט מוכן מראש.
 */

const WHATSAPP_TEMPLATES = {
  "בטיפול": (name, ticketNumber) =>
    `שלום ${name} 👋\nקריאת השירות מס׳ ${ticketNumber} עברה לטיפול.\nצוות Workies יעדכן אותך בהמשך.\n— צוות Workies`,
  "הושלם": (name, ticketNumber) =>
    `שלום ${name} 👋\nקריאת השירות מס׳ ${ticketNumber} הושלמה בהצלחה ✅\nתודה על הסבלנות!\n— צוות Workies`,
};

/**
 * פותח חלון וואטסאפ עם הודעה מוכנה לדייר.
 * @param {object} ticket — הקריאה (מכילה customer_name, ticket_number, phone)
 * @param {object|null} tenant — דייר מ-RoomTenant (מכיל customer_name, phone) או null
 * @param {string} newStatus — הסטטוס החדש ("בטיפול" או "הושלם")
 */
export function openTenantWhatsApp(ticket, tenant, newStatus) {
  if (!ticket) return;
  const template = WHATSAPP_TEMPLATES[newStatus];
  if (!template) return;

  const name = tenant?.customer_name || ticket.customer_name || "לקוח";
  const ticketNumber = ticket.ticket_number || ticket.id || "";
  const message = template(name, ticketNumber);

  // מספר טלפון — מעדיף דייר, אחרת מהקריאה
  let phone = tenant?.phone || ticket.phone || "";
  // ניקוי: רק ספרות, הסרת רווחים/מקפים/סוגריים
  phone = String(phone).replace(/[^\d]/g, "");
  // אם מתחיל ב-0 — המר לפורמט בינלאומי ישראלי
  if (phone.startsWith("0")) phone = "972" + phone.slice(1);
  if (!phone) return;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}