import { base44 } from "@/api/base44Client";
import { generateTicketNumber, calculateSlaWarningAtMs, PRIORITY_SLA_MINUTES } from "@/lib/slaUtils";
import { calculateSlaDeadlineWithinServiceHours } from "@/lib/slaAgent";
import { REFERRAL_TICKET_TYPE, REFERRAL_STATUSES, TERMINAL_REFERRAL_STATUSES, VOUCHER_PER_OFFICE, normalizePhone } from "@/lib/referralConfig";

// פתיחת קריאת שירות לפי מודל הקריאות + רישום ההמלצה
export async function submitReferral(user, { friend_name, friend_phone, details }) {
  const openedAt = new Date();
  const slaMin = PRIORITY_SLA_MINUTES["רגילה"] || null;
  let sla = {};
  if (slaMin) {
    const { slaStart, slaDeadline } = calculateSlaDeadlineWithinServiceHours(openedAt, slaMin);
    const warnMs = calculateSlaWarningAtMs(slaStart.getTime(), slaMin);
    sla = {
      sla_minutes: slaMin,
      sla_start_at: slaStart.toISOString(), sla_start_at_ms: slaStart.getTime(),
      sla_deadline: slaDeadline.toISOString(), sla_deadline_ms: slaDeadline.getTime(),
      sla_warning_at: new Date(warnMs).toISOString(), sla_warning_at_ms: warnMs,
    };
  }
  const isRoom = user?.default_location_type === "room" && user?.default_room_number;

  const ticket = await base44.entities.ServiceTicket.create({
    ticket_number: generateTicketNumber(),
    ticket_type: REFERRAL_TICKET_TYPE,
    request_type: REFERRAL_TICKET_TYPE,
    customer_name: user?.full_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    issue_description: `חבר מביא חבר: ${friend_name} (${friend_phone})`,
    notes: details || "",
    area: "אחר",
    priority: "רגילה",
    location_type: isRoom ? "room" : "none",
    room_number: isRoom ? user.default_room_number : null,
    room_label: isRoom ? user.default_room_label : null,
    room_area: isRoom ? user.default_room_area : null,
    status: "פתוחה",
    opened_at: openedAt.toISOString(),
    opened_at_ms: openedAt.getTime(),
    ...sla,
    sla_breached: false,
    source_system: "Base44-ServiceTickets",
    aio_ready: true,
    created_by: user?.email || "",
    created_by_id: user?.id || "",
    created_by_name: user?.full_name || "",
    update_history: [{ date: openedAt.toISOString(), action: "קריאה נפתחה — חבר מביא חבר", user: user?.full_name || "מערכת", note: "" }],
  });

  const referral = await base44.entities.Referral.create({
    friend_name, friend_phone, details,
    friend_phone_normalized: normalizePhone(friend_phone),
    referrer_name: user?.full_name || "",
    referrer_email: user?.email || "",
    referrer_phone: user?.phone || "",
    referrer_room: isRoom ? `${user.default_room_label} (${user.default_room_number})` : "",
    ticket_id: ticket.id,
    ticket_number: ticket.ticket_number,
    terms_accepted: true,
    status: "new",
    status_history: [{ date: openedAt.toISOString(), status: "new", user: user?.full_name || "", note: "ההמלצה נשלחה" }],
  });

  base44.functions.invoke("ticketNotifications", { action: "ticket_created", ticket }).catch(() => {});
  return { ticket, referral };
}

// עדכון סטטוס ההמלצה + סנכרון קריאת השירות המקושרת
export async function updateReferralStatus(referral, { status, note, crm_registered, offices_count }, user) {
  const now = new Date().toISOString();
  const userLabel = user?.full_name || user?.email || "מנהל";
  const updates = {
    status,
    status_note: note || "",
    crm_registered: !!crm_registered,
    offices_count: Number(offices_count) || 0,
    voucher_amount: (Number(offices_count) || 0) * VOUCHER_PER_OFFICE,
    status_history: [...(referral.status_history || []), { date: now, status, user: userLabel, note: note || "" }],
  };
  if (status === "voucher_given" && !referral.voucher_given_at) updates.voucher_given_at = now;
  await base44.entities.Referral.update(referral.id, updates);

  if (referral.ticket_id && status !== referral.status) {
    const ticket = await base44.entities.ServiceTicket.get(referral.ticket_id);
    const label = REFERRAL_STATUSES[status].label;
    await base44.entities.ServiceTicket.update(referral.ticket_id, {
      status: REFERRAL_STATUSES[status].ticketStatus,
      ...(TERMINAL_REFERRAL_STATUSES.includes(status) ? { closed_at: now, resolution_summary: `${label}${note ? ` — ${note}` : ""}` } : {}),
      update_history: [...(ticket.update_history || []), { date: now, action: `סטטוס המלצה: ${label}`, user: userLabel, note: note || "" }],
    });
  }
}

export function exportReferralsCsv(referrals) {
  const headers = ["תאריך", "ממליץ/ה", "חדר", "מייל ממליץ", "שם חבר/ה", "טלפון חבר/ה", "פרטים", "סטטוס", "הערת סטטוס", "CRM", "משרדים", "שובר ₪", "מספר קריאה"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = referrals.map(r => [
    new Date(r.created_date).toLocaleDateString("he-IL"), r.referrer_name, r.referrer_room, r.referrer_email,
    r.friend_name, r.friend_phone, r.details, REFERRAL_STATUSES[r.status]?.label, r.status_note,
    r.crm_registered ? "כן" : "לא", r.offices_count || 0, r.voucher_amount || 0, r.ticket_number,
  ].map(esc).join(","));
  const blob = new Blob(["\uFEFF" + [headers.map(esc).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `referrals_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}