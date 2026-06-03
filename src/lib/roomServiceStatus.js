import { getLiveSlaDisplay, isTicketLive, isTicketSlaBreached } from '@/lib/slaAgent';

const PRIORITY_RANK = { 'קריטית': 4, 'גבוהה': 3, 'בינונית': 2, 'רגילה': 1 };

export function getMostUrgentTicket(tickets) {
  if (!tickets || tickets.length === 0) return null;
  return [...tickets].sort((a, b) => {
    const aBreached = isTicketSlaBreached(a) ? 1 : 0;
    const bBreached = isTicketSlaBreached(b) ? 1 : 0;
    if (aBreached !== bBreached) return bBreached - aBreached;
    const aPri = PRIORITY_RANK[a.priority] || 0;
    const bPri = PRIORITY_RANK[b.priority] || 0;
    if (aPri !== bPri) return bPri - aPri;
    const aD = Number(a.sla_deadline_ms) || Infinity;
    const bD = Number(b.sla_deadline_ms) || Infinity;
    return aD - bD;
  })[0];
}

export function getRoomServiceStatus(roomNumber, tickets = []) {
  const roomTickets = tickets.filter(
    t => isTicketLive(t) && String(t.room_number) === String(roomNumber)
  );

  if (roomTickets.length === 0) {
    return { status: 'clear', openCount: 0, urgentCount: 0, breachedCount: 0, tickets: [], mostUrgentTicket: null, slaDisplay: null };
  }

  const mostUrgentTicket = getMostUrgentTicket(roomTickets);
  const slaDisplay = getLiveSlaDisplay(mostUrgentTicket);
  const breachedCount = roomTickets.filter(t => isTicketSlaBreached(t)).length;
  const urgentCount = roomTickets.filter(t => t.priority === 'קריטית' || t.priority === 'גבוהה').length;

  let status = 'open';
  if (slaDisplay.status === 'breached') status = 'breached';
  else if (slaDisplay.status === 'critical') status = 'critical';
  else if (slaDisplay.status === 'warning') status = 'warning';

  return { status, openCount: roomTickets.length, urgentCount, breachedCount, tickets: roomTickets, mostUrgentTicket, slaDisplay };
}

export const ROOM_STATUS_COLORS = {
  clear:    { bg: '#dcfce7', border: '#86efac', text: '#166534', label: 'תקין' },
  open:     { bg: '#dbeafe', border: '#60a5fa', text: '#1d4ed8', label: 'קריאה פתוחה' },
  warning:  { bg: '#ffedd5', border: '#fb923c', text: '#c2410c', label: 'מתקרב ל-SLA' },
  critical: { bg: '#fee2e2', border: '#f87171', text: '#991b1b', label: 'קריטי' },
  breached: { bg: '#fecaca', border: '#ef4444', text: '#7f1d1d', label: 'חריגת SLA' },
  inactive: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', label: 'לא פעיל' },
};