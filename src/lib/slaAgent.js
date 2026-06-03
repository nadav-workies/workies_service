/**
 * slaAgent.js — מקור האמת היחיד לכל חישובי SLA
 * משרת: דשבורד, דוח SLA, מפת שירות, טבלת קריאות, LiveSlaBadge
 */

import { getCurrentCalendarMonthRange } from '@/lib/dateRangeUtils';

// ─── פונקציות בסיס ────────────────────────────────────────────────

export function getDeadlineMs(ticket) {
  if (ticket.sla_deadline_ms) return Number(ticket.sla_deadline_ms);
  if (ticket.sla_deadline) return new Date(ticket.sla_deadline).getTime();
  return null;
}

export function isTicketClosed(ticket) {
  return ticket.status === 'נסגרה';
}

export function isTicketLive(ticket) {
  return Boolean(
    ticket &&
    ticket.status !== 'נסגרה' &&
    ticket.archived !== true &&
    ticket.is_test_data !== true &&
    ticket.exclude_from_metrics !== true
  );
}

export function isTicketSlaBreached(ticket, nowMs = Date.now()) {
  if (!isTicketLive(ticket)) return false;
  const deadlineMs = getDeadlineMs(ticket);
  if (!deadlineMs) return false;
  return nowMs > deadlineMs;
}

// ─── פורמט משך זמן ────────────────────────────────────────────────

export function formatDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} דק׳`;
  if (hours >= 24) return `${Math.floor(hours / 24)} ימים`;
  return `${hours}ש׳ ${minutes}ד׳`;
}

// ─── חיווי SLA חי (לשימוש LiveSlaBadge ו-RoomCell) ───────────────

export function getLiveSlaDisplay(ticket, nowMs = Date.now()) {
  if (!ticket) return { label: 'ללא קריאה', status: 'none', pulse: false };
  if (ticket.status === 'נסגרה') return { label: 'נסגרה', status: 'closed', pulse: false };

  const deadlineMs = getDeadlineMs(ticket);
  const slaMinutes = Number(ticket.sla_minutes || 0);

  if (!deadlineMs || !slaMinutes) return { label: 'ללא SLA', status: 'none', pulse: false };

  const diffMs = deadlineMs - nowMs;
  const diffMinutes = Math.ceil(diffMs / 60000);

  if (diffMs <= 0) {
    const overMinutes = Math.ceil(Math.abs(diffMs) / 60000);
    const hours = Math.floor(overMinutes / 60);
    const minutes = overMinutes % 60;
    return {
      label: hours > 0 ? `חרג ב-${hours}ש׳ ${minutes}ד׳` : `חרג ב-${overMinutes} ד׳`,
      status: 'breached',
      pulse: true,
    };
  }

  let warningThreshold;
  if (slaMinutes <= 5) warningThreshold = slaMinutes;
  else if (slaMinutes === 10) warningThreshold = 5;
  else if (slaMinutes === 20) warningThreshold = 10;
  else if (slaMinutes === 30) warningThreshold = 15;
  else warningThreshold = 30;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const label = hours > 0 ? `נותרו ${hours}ש׳ ${minutes}ד׳` : `נותרו ${diffMinutes} ד׳`;

  if (diffMinutes <= 5) return { label, status: 'critical', pulse: true };
  if (diffMinutes <= warningThreshold) return { label, status: 'warning', pulse: false };
  return { label, status: 'ok', pulse: false };
}

// ─── תווית זמן שנותר (לטבלאות ובאדג'ים) ─────────────────────────

export function getTimeRemainingLabel(ticket) {
  const deadlineMs = getDeadlineMs(ticket);
  if (!deadlineMs) return { text: '—', breached: false };
  const now = Date.now();
  const diffMs = deadlineMs - now;
  if (diffMs <= 0) {
    const over = Math.abs(diffMs);
    const h = Math.floor(over / 3600000);
    const m = Math.floor((over % 3600000) / 60000);
    return { text: h > 0 ? `חריגה ${h}ש׳ ${m}ד׳` : `חריגה ${m}ד׳`, breached: true };
  }
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  if (h === 0) return { text: `${m} דק׳`, breached: false };
  if (h >= 24) return { text: `${Math.floor(h / 24)} ימים`, breached: false };
  return { text: `${h}ש׳ ${m}ד׳`, breached: false };
}

// ─── פילטור קריאות חיות ──────────────────────────────────────────

export function getLiveTickets(tickets = []) {
  return tickets.filter(isTicketLive);
}

export function getLiveSurveyResponses(responses = []) {
  return responses.filter(r => r && !r.is_test_data);
}

// ─── טווחי תאריכים ────────────────────────────────────────────────

export function getCurrentMonthRange() {
  return getCurrentCalendarMonthRange();
}

export function getDateRangeFromFilters(filters = {}) {
  if (filters.dateFrom && filters.dateTo) {
    return {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }
  return getCurrentCalendarMonthRange();
}

export function filterTicketsByOpenedDate(tickets = [], range = {}) {
  const { dateFrom, dateTo } = range;
  if (!dateFrom || !dateTo) return tickets;
  const from = new Date(dateFrom).getTime();
  const to = new Date(dateTo + 'T23:59:59').getTime();
  return tickets.filter(t => {
    const openedMs = t.opened_at_ms
      ? Number(t.opened_at_ms)
      : t.opened_at
        ? new Date(t.opened_at).getTime()
        : t.created_date
          ? new Date(t.created_date).getTime()
          : null;
    if (!openedMs) return false;
    return openedMs >= from && openedMs <= to;
  });
}

// ─── חישוב מדדי SLA חודשיים ──────────────────────────────────────

export function calculateMonthlySlaMetrics(tickets = [], range = {}, nowMs = Date.now()) {
  const rangeTickets = filterTicketsByOpenedDate(tickets, range);

  const closed = rangeTickets.filter(t => t.status === 'נסגרה');
  const open = rangeTickets.filter(t => t.status !== 'נסגרה');

  // חריגות: קריאות שחרגו (פתוחות או סגורות עם sla_breached)
  const breachedTickets = rangeTickets.filter(t => {
    if (t.sla_excluded) return false;
    if (t.status === 'נסגרה') return Boolean(t.sla_breached);
    return isTicketSlaBreached(t, nowMs);
  });

  const withSla = rangeTickets.filter(t => !t.sla_excluded && getDeadlineMs(t));
  const totalBreached = breachedTickets.length;
  const totalWithSla = withSla.length;
  const slaCompliance = totalWithSla > 0
    ? Math.round(((totalWithSla - totalBreached) / totalWithSla) * 100)
    : null;

  // זמן טיפול ממוצע (סגורות בלבד עם opened_at + closed_at)
  const handlingTimes = closed
    .map(t => {
      const openMs = t.opened_at_ms ? Number(t.opened_at_ms) : t.opened_at ? new Date(t.opened_at).getTime() : null;
      const closeMs = t.closed_at ? new Date(t.closed_at).getTime() : null;
      if (!openMs || !closeMs || closeMs <= openMs) return null;
      return closeMs - openMs;
    })
    .filter(Boolean);

  const averageHandlingTimeMs = handlingTimes.length > 0
    ? Math.round(handlingTimes.reduce((a, b) => a + b, 0) / handlingTimes.length)
    : null;

  return {
    totalTickets: rangeTickets.length,
    totalOpen: open.length,
    totalClosed: closed.length,
    totalBreached,
    totalWithSla,
    slaCompliance,
    averageHandlingTimeMs,
    breachedTickets,
    openTickets: open,
    closedTickets: closed,
  };
}