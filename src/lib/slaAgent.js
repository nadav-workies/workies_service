/**
 * slaAgent.js — מקור האמת היחיד לכל חישובי SLA
 * משרת: Dashboard, SLAReport, Tickets, TicketTable, TicketStatusBadge,
 *        LiveSlaBadge, ServiceMap, RoomCell, roomServiceStatus, KPICards
 */

import {
  getCurrentCalendarMonthRange,
  getCustomDateRange,
} from "@/lib/dateRangeUtils";

/* ─────────────────────────────────────────────────────
   בסיס — קבלת ערכי זמן מ-ticket
───────────────────────────────────────────────────── */

export function getDeadlineMs(ticket) {
  if (!ticket) return null;
  if (ticket.sla_deadline_ms) {
    const v = Number(ticket.sla_deadline_ms);
    return Number.isFinite(v) ? v : null;
  }
  if (ticket.sla_deadline) {
    const v = new Date(ticket.sla_deadline).getTime();
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

export function getOpenedAtMs(ticket) {
  if (!ticket) return null;
  if (ticket.opened_at_ms) {
    const v = Number(ticket.opened_at_ms);
    return Number.isFinite(v) ? v : null;
  }
  if (ticket.opened_at) {
    const v = new Date(ticket.opened_at).getTime();
    return Number.isFinite(v) ? v : null;
  }
  // fallback לנתוני עבר בלבד. קריאות חדשות חייבות להישמר עם opened_at_ms.
  if (ticket.created_date) {
    const v = new Date(ticket.created_date).getTime();
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

export function getClosedAtMs(ticket) {
  if (!ticket || !ticket.closed_at) return null;
  const v = new Date(ticket.closed_at).getTime();
  return Number.isFinite(v) ? v : null;
}

/* ─────────────────────────────────────────────────────
   בדיקות סטטוס
───────────────────────────────────────────────────── */

export function isTicketClosed(ticket) {
  return ticket?.status === "נסגרה";
}

export function isTicketLive(ticket) {
  return Boolean(
    ticket &&
    ticket.archived !== true &&
    ticket.is_test_data !== true &&
    ticket.exclude_from_metrics !== true
  );
}

export function isTicketOpen(ticket) {
  return isTicketLive(ticket) && !isTicketClosed(ticket);
}

export function isSlaExcluded(ticket) {
  return ticket?.sla_excluded === true;
}

/* ─────────────────────────────────────────────────────
   סינון קריאות
───────────────────────────────────────────────────── */

export function getLiveTickets(tickets = []) {
  return tickets.filter(isTicketLive);
}

export function getLiveSurveyResponses(responses = []) {
  return responses.filter(r =>
    r &&
    r.archived !== true &&
    r.is_test_data !== true &&
    r.exclude_from_metrics !== true
  );
}

/* ─────────────────────────────────────────────────────
   טווחי תאריכים
───────────────────────────────────────────────────── */

export function getCurrentMonthRange() {
  return getCurrentCalendarMonthRange();
}

export function getDateRangeFromFilters(filters = {}) {
  const { dateFrom, dateTo } = filters;
  if (dateFrom && dateTo) return getCustomDateRange(dateFrom, dateTo);
  return getCurrentCalendarMonthRange();
}

export function filterTicketsByOpenedDate(tickets = [], range) {
  if (!range?.startMs || !range?.endMs) return getLiveTickets(tickets);
  return getLiveTickets(tickets).filter(ticket => {
    const ms = getOpenedAtMs(ticket);
    return ms !== null && ms >= range.startMs && ms <= range.endMs;
  });
}

/* alias — לתאימות עם SLAReport שמשתמש ב-filterTicketsByDateRange */
export function filterTicketsByDateRange(tickets = [], range) {
  return filterTicketsByOpenedDate(tickets, range);
}

/* ─────────────────────────────────────────────────────
   פורמט זמן
───────────────────────────────────────────────────── */

export function formatDuration(ms) {
  if (!ms || ms <= 0) return "אין נתונים";
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return "פחות מדקה";
  if (totalMinutes < 60) return `${totalMinutes} דק׳`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return restHours > 0 ? `${days} ימים ${restHours}ש׳` : `${days} ימים`;
  }
  return minutes > 0 ? `${hours}ש׳ ${minutes}ד׳` : `${hours}ש׳`;
}

/* ─────────────────────────────────────────────────────
   חישוב חריגות
───────────────────────────────────────────────────── */

export function isTicketSlaBreached(ticket, nowMs = Date.now()) {
  if (!isTicketOpen(ticket)) return false;
  if (isSlaExcluded(ticket)) return false;
  const deadlineMs = getDeadlineMs(ticket);
  if (!deadlineMs) return false;
  return nowMs > deadlineMs;
}

export function isClosedTicketBreached(ticket) {
  if (!isTicketClosed(ticket)) return false;
  if (isSlaExcluded(ticket)) return false;
  const deadlineMs = getDeadlineMs(ticket);
  const closedAtMs = getClosedAtMs(ticket);
  if (!deadlineMs || !closedAtMs) return false;
  return closedAtMs > deadlineMs;
}

export function isClosedTicketOnTime(ticket) {
  if (!isTicketClosed(ticket)) return false;
  if (isSlaExcluded(ticket)) return false;
  const deadlineMs = getDeadlineMs(ticket);
  const closedAtMs = getClosedAtMs(ticket);
  if (!deadlineMs || !closedAtMs) return false;
  return closedAtMs <= deadlineMs;
}

/* ─────────────────────────────────────────────────────
   חיווי SLA חי (לשימוש LiveSlaBadge, RoomCell)
───────────────────────────────────────────────────── */

export function getLiveSlaDisplay(ticket, nowMs = Date.now()) {
  if (!ticket) return { label: "ללא קריאה", status: "none", pulse: false };
  if (isTicketClosed(ticket)) return { label: "נסגרה", status: "closed", pulse: false };

  const deadlineMs = getDeadlineMs(ticket);
  const slaMinutes = Number(ticket.sla_minutes || 0);

  if (!deadlineMs || !slaMinutes) return { label: "ללא SLA", status: "none", pulse: false };

  const diffMs = deadlineMs - nowMs;
  const diffMinutes = Math.ceil(diffMs / 60000);

  if (diffMs <= 0) {
    return {
      label: `חרג ב-${formatDuration(Math.abs(diffMs))}`,
      status: "breached",
      pulse: true,
    };
  }

  let warningThreshold;
  if (slaMinutes <= 5) warningThreshold = slaMinutes;
  else if (slaMinutes === 10) warningThreshold = 5;
  else if (slaMinutes === 20) warningThreshold = 10;
  else if (slaMinutes === 30) warningThreshold = 15;
  else warningThreshold = 30;

  const label = `נותרו ${formatDuration(diffMinutes * 60000)}`;

  if (diffMinutes <= 5) return { label, status: "critical", pulse: true };
  if (diffMinutes <= warningThreshold) return { label, status: "warning", pulse: false };
  return { label, status: "ok", pulse: false };
}

export function getTimeRemainingLabel(ticket) {
  const display = getLiveSlaDisplay(ticket);
  return {
    text: display.label,
    breached: display.status === "breached",
    status: display.status,
  };
}

/* ─────────────────────────────────────────────────────
   זמן טיפול
───────────────────────────────────────────────────── */

export function getTicketHandlingTimeMs(ticket) {
  if (!isTicketClosed(ticket)) return null;
  if (isSlaExcluded(ticket)) return null;
  const openedAtMs = getOpenedAtMs(ticket);
  const closedAtMs = getClosedAtMs(ticket);
  if (!openedAtMs || !closedAtMs || closedAtMs <= openedAtMs) return null;
  return closedAtMs - openedAtMs;
}

/* ─────────────────────────────────────────────────────
   חישוב מדדי SLA תקופתיים
   מחזיר את כל השדות הנדרשים ע"י: Dashboard, SLAReport, KPICards
───────────────────────────────────────────────────── */

export function calculateMonthlySlaMetrics(
  tickets = [],
  range = getCurrentMonthRange(),
  nowMs = Date.now()
) {
  // כל קריאות התקופה (חיות, בטווח תאריכים)
  const periodTickets = filterTicketsByOpenedDate(tickets, range);

  const closedTickets   = periodTickets.filter(isTicketClosed);
  const openTickets     = periodTickets.filter(t => !isTicketClosed(t));
  const excludedList    = periodTickets.filter(isSlaExcluded);

  // קריאות ללא נתוני SLA (לא מוחרגות)
  const noSlaDataList = periodTickets.filter(
    t => !isSlaExcluded(t) && (!getDeadlineMs(t) || !Number(t.sla_minutes || 0))
  );
  const noSlaDataCount = noSlaDataList.length;

  // קריאות ניתנות למדידה
  const breachedOpenList   = openTickets.filter(t => isTicketSlaBreached(t, nowMs));
  const breachedClosedList = closedTickets.filter(isClosedTicketBreached);
  const closedOnTimeList   = closedTickets.filter(isClosedTicketOnTime);

  const totalBreached  = breachedOpenList.length + breachedClosedList.length;
  const closedOnTime   = closedOnTimeList.length;
  // ניתנות למדידה = סגורות + פתוחות שחרגו
  const totalMeasured  = closedTickets.length + breachedOpenList.length;

  const slaCompliance =
    totalMeasured > 0
      ? Math.round((closedOnTime / totalMeasured) * 100)
      : null;

  // זמן טיפול ממוצע על סגורות
  const handlingTimes = closedTickets
    .map(getTicketHandlingTimeMs)
    .filter(ms => typeof ms === "number" && ms > 0);

  const averageHandlingTimeMs =
    handlingTimes.length > 0
      ? Math.round(handlingTimes.reduce((a, b) => a + b, 0) / handlingTimes.length)
      : null;

  return {
    // ספירות
    totalTickets: periodTickets.length,
    totalOpen:    openTickets.length,
    totalClosed:  closedTickets.length,
    totalMeasured,
    totalBreached,
    closedOnTime,
    breachedOpen:   breachedOpenList.length,
    breachedClosed: breachedClosedList.length,
    noSlaDataCount,

    // אחוז עמידה
    slaCompliance,

    // זמן ממוצע
    averageHandlingTimeMs,

    // רשימות מפורטות (לדוח SLA)
    breachedOpenList,
    breachedClosedList,
    closedOnTimeList,
    excludedList,
    noSlaDataList,

    // תאימות עם Dashboard שמשתמש ב-openTickets / closedTickets
    openTickets,
    closedTickets,
    breachedTickets: [...breachedOpenList, ...breachedClosedList],
  };
}