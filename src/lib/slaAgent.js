/**
 * slaAgent.js — מקור SLA מרכזי למפת שירות ולחיווי חי
 */

export function getDeadlineMs(ticket) {
  if (ticket.sla_deadline_ms) return Number(ticket.sla_deadline_ms);
  if (ticket.sla_deadline) return new Date(ticket.sla_deadline).getTime();
  return null;
}

export function isTicketClosed(ticket) {
  return ticket.status === 'נסגרה';
}

export function isTicketLive(ticket) {
  return (
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

export function formatDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} דק׳`;
  if (hours >= 24) return `${Math.floor(hours / 24)} ימים`;
  return `${hours}ש׳ ${minutes}ד׳`;
}

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