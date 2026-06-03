import { getSlaStatus } from './slaUtils';

// כל סטטוס שאינו "נסגרה" נחשב פתוח
const CLOSED_STATUS = 'נסגרה';

/**
 * getRoomServiceStatus(roomNumber, tickets)
 * Returns: { status, openCount, urgentCount, breachedCount, tickets }
 */
export function getRoomServiceStatus(roomNumber, tickets) {
  const roomTickets = tickets.filter(
    t => String(t.room_number) === String(roomNumber) &&
         t.status !== CLOSED_STATUS &&
         !t.archived
  );

  if (roomTickets.length === 0) {
    return { status: 'clear', openCount: 0, urgentCount: 0, breachedCount: 0, tickets: [] };
  }

  return {
    status: 'open',
    openCount: roomTickets.length,
    urgentCount: 0,
    breachedCount: 0,
    tickets: roomTickets,
  };
}

export const ROOM_STATUS_COLORS = {
  clear:    { bg: '#dcfce7', border: '#86efac', text: '#166534', label: 'תקין' },
  open:     { bg: '#fee2e2', border: '#f87171', text: '#991b1b', label: 'יש קריאה פתוחה' },
  urgent:   { bg: '#fee2e2', border: '#f87171', text: '#991b1b', label: 'יש קריאה פתוחה' },
  breached: { bg: '#fee2e2', border: '#f87171', text: '#991b1b', label: 'יש קריאה פתוחה' },
  inactive: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', label: 'לא פעיל' },
};