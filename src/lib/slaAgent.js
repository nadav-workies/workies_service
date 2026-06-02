/**
 * slaAgent.js — מקור אמת יחיד לכל חישובי SLA
 * ================================================
 * מיוצא מ-slaUtils re-exports לתאימות לאחור, וכן פונקציות חדשות:
 *   - calculateMonthlySlaMetrics
 *   - getCurrentMonthRange
 *   - getMonthRange
 *   - formatDuration
 *   - isTicketSlaBreached (alias)
 */

import {
  getDeadlineMs,
  getOpenedAtMs,
  getTimeRemainingLabel,
  isTicketBreached,
} from "@/lib/slaUtils";

// re-exports לתאימות לאחור
export { getDeadlineMs, getOpenedAtMs, getTimeRemainingLabel };
export { isTicketBreached as isTicketSlaBreached };

// ─── טווח חודש ──────────────────────────────────────────────────────────────

/** מחזיר { startMs, endMs } עבור שנה+חודש נתונים (0-indexed month) */
export function getMonthRange(year, month) {
  const startMs = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const endMs   = new Date(year, month + 1, 1, 0, 0, 0, 0).getTime(); // exclusive
  return { startMs, endMs };
}

/** מחזיר את טווח החודש הנוכחי */
export function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

// ─── עיצוב משך זמן ──────────────────────────────────────────────────────────

/** מקבל milliseconds ומחזיר מחרוזת קריאה (e.g. "2ש׳ 15ד׳") */
export function formatDuration(ms) {
  if (ms == null || ms < 0) return '—';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} דק׳`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}י׳ ${rh}ש׳` : `${d} ימים`;
  }
  return m > 0 ? `${h}ש׳ ${m}ד׳` : `${h} שעות`;
}

// ─── חישוב זמן טיפול ────────────────────────────────────────────────────────

/**
 * מחזיר את זמן הטיפול בmilliseconds עבור קריאה סגורה.
 * מחשב מ-opened_at_ms עד closed_at.
 * מחזיר null אם לא ניתן לחשב.
 */
export function getTicketHandlingTimeMs(ticket) {
  if (ticket.status !== 'נסגרה') return null;
  const openedMs = getOpenedAtMs(ticket);
  if (!openedMs) return null;
  const closedMs = ticket.closed_at ? new Date(ticket.closed_at).getTime() : null;
  if (!closedMs || closedMs <= openedMs) return null;
  return closedMs - openedMs;
}

// ─── חישוב מדדי SLA חודשיים ─────────────────────────────────────────────────

/**
 * calculateMonthlySlaMetrics
 * ---------------------------
 * מקבל: tickets (מערך), range { startMs, endMs }
 * מחזיר אובייקט מדדים מלא.
 *
 * כללי סינון:
 *  - קריאה נכנסת לחודש אם opened_at_ms נמצא בטווח [startMs, endMs)
 *  - קריאות מוחרגות (sla_excluded=true) נספרות בנפרד ולא נמדדות
 *  - קריאות ללא sla_minutes/sla_deadline לא נמדדות (noSlaData)
 *
 * עמידה ב-SLA מחושבת על:
 *  - קריאות סגורות שלא חרגו SLA בעת סגירה
 *  - קריאות פתוחות רק אם כבר עברו את מועד היעד (נחשבות כחריגה)
 */
export function calculateMonthlySlaMetrics(tickets, range) {
  const { startMs, endMs } = range;
  const nowMs = Date.now();

  // סינון לחודש
  const monthTickets = tickets.filter(t => {
    const openedMs = getOpenedAtMs(t);
    return openedMs && openedMs >= startMs && openedMs < endMs;
  });

  // הפרדה: מוחרגות vs שאר
  const excluded = monthTickets.filter(t => t.sla_excluded === true);
  const active   = monthTickets.filter(t => !t.sla_excluded);

  // קריאות עם/ללא נתוני SLA
  const withSla    = active.filter(t => t.sla_deadline_ms || t.sla_deadline || t.sla_minutes);
  const noSlaData  = active.filter(t => !t.sla_deadline_ms && !t.sla_deadline && !t.sla_minutes);

  const closed = withSla.filter(t => t.status === 'נסגרה');
  const open   = withSla.filter(t => t.status !== 'נסגרה');

  // חריגות בקריאות סגורות: sla_breached=true שנרשם בסגירה
  const breachedClosedList = closed.filter(t => t.sla_breached === true);

  // חריגות בקריאות פתוחות: deadline עבר
  const breachedOpenList = open.filter(t => {
    const dl = getDeadlineMs(t);
    return dl && dl < nowMs;
  });

  const breachedOpen   = breachedOpenList.length;
  const breachedClosed = breachedClosedList.length;
  const totalBreached  = breachedOpen + breachedClosed;

  // קריאות שנסגרו בזמן (עמידה ב-SLA)
  const closedOnTime = closed.filter(t => !t.sla_breached).length;

  // עמידה ב-SLA: מחושבת רק על קריאות מדידות (עם SLA)
  // == קריאות סגורות בזמן / (כל הסגורות + קריאות פתוחות שחרגו)
  const totalMeasured = closed.length + breachedOpen;
  const slaCompliance = totalMeasured > 0
    ? Math.round((closedOnTime / totalMeasured) * 100)
    : null;

  // ממוצע זמן טיפול — רק קריאות סגורות
  const handlingTimes = closed
    .map(t => getTicketHandlingTimeMs(t))
    .filter(ms => ms !== null);
  const averageHandlingTimeMs = handlingTimes.length > 0
    ? Math.round(handlingTimes.reduce((a, b) => a + b, 0) / handlingTimes.length)
    : null;

  return {
    // סיכום כללי
    totalTickets: monthTickets.length,
    openTickets:  active.filter(t => t.status !== 'נסגרה').length,
    closedTickets: active.filter(t => t.status === 'נסגרה').length,

    // מדידה
    totalMeasured,
    closedOnTime,
    slaCompliance,

    // חריגות
    totalBreached,
    breachedOpen,
    breachedClosed,
    breachedOpenList,
    breachedClosedList,

    // זמן טיפול
    averageHandlingTimeMs,

    // מוחרגות
    excludedList: excluded,

    // חסרי נתוני SLA
    noSlaDataCount: noSlaData.length,
    noSlaDataList:  noSlaData,
  };
}