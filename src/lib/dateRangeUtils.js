/**
 * dateRangeUtils.js — פונקציות עזר לחישוב טווחי תאריכים
 * כל הפונקציות עובדות בזמן מקומי (ללא UTC)
 */

export function formatLocalDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCalendarMonthRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end   = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return {
    startMs:  start.getTime(),
    endMs:    end.getTime(),
    dateFrom: formatLocalDateInput(start),
    dateTo:   formatLocalDateInput(end),
    label:    `${String(monthIndex + 1).padStart(2, "0")}/${year}`,
  };
}

export function getCurrentCalendarMonthRange(now = new Date()) {
  return getCalendarMonthRange(now.getFullYear(), now.getMonth());
}

export function getPreviousCalendarMonthRange(now = new Date()) {
  const year       = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const monthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return getCalendarMonthRange(year, monthIndex);
}

export function getCustomDateRange(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return getCurrentCalendarMonthRange();
  const start = new Date(`${dateFrom}T00:00:00`);
  const end   = new Date(`${dateTo}T23:59:59.999`);
  return {
    startMs:  start.getTime(),
    endMs:    end.getTime(),
    dateFrom,
    dateTo,
    label:    `${dateFrom} – ${dateTo}`,
  };
}

export function getRangeFromMonthValue(monthValue) {
  if (!monthValue) return getCurrentCalendarMonthRange();
  const [year, month] = monthValue.split("-").map(Number);
  return getCalendarMonthRange(year, month - 1);
}

export function getTodayRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    startMs:  start.getTime(),
    endMs:    end.getTime(),
    dateFrom: formatLocalDateInput(start),
    dateTo:   formatLocalDateInput(end),
    label:    "היום",
  };
}

/* ─── alias לתאימות עם קוד ישן ───────────────────── */

export function isTicketInDateRange(ticket, range) {
  const openedAtMs = Number(ticket.opened_at_ms);
  if (!openedAtMs) return false;
  return openedAtMs >= range.startMs && openedAtMs <= range.endMs;
}

export function filterTicketsByDateRange(tickets, range) {
  return tickets.filter(ticket => isTicketInDateRange(ticket, range));
}

export function isMsInRange(ms, range) {
  if (!ms || !range?.startMs || !range?.endMs) return false;
  return ms >= range.startMs && ms <= range.endMs;
}

export function isDateStringInRange(dateString, range) {
  if (!dateString) return false;
  const ms = new Date(dateString).getTime();
  if (!Number.isFinite(ms)) return false;
  return isMsInRange(ms, range);
}

export function filterSurveyResponsesBySubmittedDate(responses = [], range) {
  return responses.filter(r => isDateStringInRange(r.submitted_at, range));
}

export function filterTicketsByClosedDate(tickets = [], range) {
  return tickets.filter(t => isDateStringInRange(t.closed_at, range));
}