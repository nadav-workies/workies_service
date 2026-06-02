/**
 * slaAgent.js — מקור אמת יחיד לכל חישובי SLA
 * ================================================
 */

import { getDeadlineMs, getOpenedAtMs, getTimeRemainingLabel } from "@/lib/slaUtils";

export { getDeadlineMs, getOpenedAtMs, getTimeRemainingLabel };

// ─── סינון קריאות חיות (מוציא ארכיון ובדיקות) ──────────────────────────────

export function getLiveTickets(tickets) {
  return tickets.filter(t =>
    !t.archived &&
    !t.is_test_data &&
    !t.exclude_from_metrics
  );
}

// ─── טווח חודש ──────────────────────────────────────────────────────────────

export function getMonthRange(year, month) {
  const startMs = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const endMs   = new Date(year, month + 1, 1, 0, 0, 0, 0).getTime();
  return { startMs, endMs };
}

export function getCurrentMonthRange() {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

// ─── עיצוב משך זמן ──────────────────────────────────────────────────────────

export function formatDuration(ms) {
  if (!ms || ms <= 0) return 'אין נתונים';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return 'פחות מדקה';
  if (totalMin < 60) return `${totalMin} דק׳`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}י׳ ${rh}ש׳` : `${d} ימים`;
  }
  return m > 0 ? `${h} שע׳ ${m} דק׳` : `${h} שע׳`;
}

// ─── בדיקות עזר ─────────────────────────────────────────────────────────────

export function isSlaExcluded(ticket) {
  return ticket.sla_excluded === true || ticket.exclude_from_metrics === true;
}

export function isClosed(ticket) {
  return ticket.status === 'נסגרה';
}

export function isTicketInPeriod(ticket, range) {
  const openedAtMs = ticket.opened_at_ms ? Number(ticket.opened_at_ms) : null;
  if (!openedAtMs) return false;
  return openedAtMs >= range.startMs && openedAtMs < range.endMs;
}

// ─── חריגת SLA ──────────────────────────────────────────────────────────────

export function isTicketSlaBreached(ticket, nowMs = Date.now()) {
  if (isSlaExcluded(ticket)) return false;
  const deadlineMs = Number(ticket.sla_deadline_ms);
  if (!deadlineMs) return false;
  if (isClosed(ticket)) {
    if (!ticket.closed_at) return false;
    return new Date(ticket.closed_at).getTime() > deadlineMs;
  }
  return nowMs > deadlineMs;
}

export function isTicketClosedOnTime(ticket) {
  if (isSlaExcluded(ticket)) return false;
  if (!isClosed(ticket)) return false;
  const deadlineMs = Number(ticket.sla_deadline_ms);
  const closedAtMs = ticket.closed_at ? new Date(ticket.closed_at).getTime() : null;
  if (!deadlineMs || !closedAtMs) return false;
  return closedAtMs <= deadlineMs;
}

// ─── זמן טיפול ──────────────────────────────────────────────────────────────

export function getTicketHandlingTimeMs(ticket) {
  if (isSlaExcluded(ticket)) return null;
  if (!isClosed(ticket)) return null;
  const openedAtMs = ticket.opened_at_ms ? Number(ticket.opened_at_ms) : null;
  const closedAtMs = ticket.closed_at ? new Date(ticket.closed_at).getTime() : null;
  if (!openedAtMs || !closedAtMs || closedAtMs <= openedAtMs) return null;
  return closedAtMs - openedAtMs;
}

// ─── חישוב מדדי SLA חודשיים ─────────────────────────────────────────────────

export function calculateMonthlySlaMetrics(allTickets, range, nowMs = Date.now()) {
  // סינון לקריאות חיות בלבד
  const liveTickets = getLiveTickets(allTickets);

  // סינון לחודש
  const monthTickets = liveTickets.filter(t => isTicketInPeriod(t, range));

  // הפרדה: מוחרגות SLA vs עם נתוני SLA
  const excluded = monthTickets.filter(t => isSlaExcluded(t));
  const withSla  = monthTickets.filter(t =>
    !isSlaExcluded(t) && Number(t.sla_deadline_ms) > 0
  );
  const noSlaData = monthTickets.filter(t =>
    !isSlaExcluded(t) && !Number(t.sla_deadline_ms)
  );

  const closed = withSla.filter(isClosed);
  const open   = withSla.filter(t => !isClosed(t));

  const breachedClosedList = closed.filter(t => isTicketSlaBreached(t, nowMs));
  const breachedOpenList   = open.filter(t => isTicketSlaBreached(t, nowMs));
  const closedOnTime       = closed.filter(isTicketClosedOnTime);

  const totalMeasured  = closed.length + breachedOpenList.length;
  const slaCompliance  = totalMeasured > 0
    ? Math.round((closedOnTime.length / totalMeasured) * 100)
    : null;

  const handlingTimes = closed
    .map(getTicketHandlingTimeMs)
    .filter(ms => typeof ms === 'number' && ms > 0);
  const averageHandlingTimeMs = handlingTimes.length > 0
    ? Math.round(handlingTimes.reduce((a, b) => a + b, 0) / handlingTimes.length)
    : null;

  return {
    totalTickets:           monthTickets.length,
    openTickets:            monthTickets.filter(t => !isClosed(t)).length,
    closedTickets:          closed.length,
    totalMeasured,
    closedOnTime:           closedOnTime.length,
    slaCompliance,
    totalBreached:          breachedOpenList.length + breachedClosedList.length,
    breachedOpen:           breachedOpenList.length,
    breachedClosed:         breachedClosedList.length,
    breachedOpenList,
    breachedClosedList,
    averageHandlingTimeMs,
    excludedList:           excluded,
    noSlaDataCount:         noSlaData.length,
    noSlaDataList:          noSlaData,
  };
}