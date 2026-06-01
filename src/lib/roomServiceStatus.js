import { getSlaStatus } from './slaUtils';

const OPEN_STATUSES = ['פתוחה', 'שויכה לטיפול', 'בטיפול', 'ממתינה'];

/**
 * getRoomServiceStatus(roomNumber, tickets)
 * Returns: { status, openCount, urgentCount, breachedCount, tickets }
 */
export function getRoomServiceStatus(roomNumber, tickets) {
  const roomTickets = tickets.filter(
    t => t.room_number === roomNumber && OPEN_STATUSES.includes(t.status)
  );

  if (roomTickets.length === 0) {
    return { status: 'clear', openCount: 0, urgentCount: 0, breachedCount: 0, tickets: [] };
  }

  let breachedCount = 0;
  let urgentCount = 0;

  for (const t of roomTickets) {
    const sla = getSlaStatus(t);
    const isCritical = t.priority === 'קריטית';
    const isHigh = t.priority === 'גבוהה';

    if (sla === 'breached' || isCritical) {
      breachedCount++;
    } else if (sla === 'warning' || isHigh) {
      urgentCount++;
    }
  }

  let status;
  if (breachedCount > 0) status = 'breached';
  else if (urgentCount > 0) status = 'urgent';
  else status = 'open';

  return {
    status,
    openCount: roomTickets.length,
    urgentCount,
    breachedCount,
    tickets: roomTickets,
  };
}

export const ROOM_STATUS_COLORS = {
  clear:    { bg: '#dcfce7', border: '#86efac', text: '#166534', label: 'תקין' },
  open:     { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', label: 'קריאה פתוחה' },
  urgent:   { bg: '#ffedd5', border: '#fb923c', text: '#9a3412', label: 'דחוף' },
  breached: { bg: '#fee2e2', border: '#f87171', text: '#991b1b', label: 'חריגת SLA' },
  inactive: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', label: 'לא פעיל' },
};