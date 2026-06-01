// SLA configuration by urgency
const SLA_CONFIG = {
  'רגילה': { hours: 48, warningHours: 24 },
  'בינונית': { hours: 24, warningHours: 12 },
  'גבוהה': { hours: 8, warningHours: 4 },
  'קריטית': { hours: 2, warningHours: 1 },
};

export function getSlaHours(urgency) {
  return SLA_CONFIG[urgency]?.hours || 48;
}

export function getSlaTarget(createdDate, urgency) {
  const hours = getSlaHours(urgency);
  const target = new Date(createdDate);
  target.setHours(target.getHours() + hours);
  return target.toISOString();
}

export function getSlaStatus(ticket) {
  if (ticket.status === 'נסגרה') return 'closed';
  
  const now = new Date();
  const target = new Date(ticket.sla_target);
  const diffMs = target - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffMs <= 0) return 'breached';
  
  const warningHours = SLA_CONFIG[ticket.urgency]?.warningHours || 24;
  if (diffHours <= warningHours) return 'warning';
  
  return 'ok';
}

export function getTimeRemaining(slaTarget) {
  const now = new Date();
  const target = new Date(slaTarget);
  const diffMs = target - now;
  
  if (diffMs <= 0) {
    const overMs = Math.abs(diffMs);
    const overHours = Math.floor(overMs / (1000 * 60 * 60));
    const overMinutes = Math.floor((overMs % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `חריגה של ${overHours} שע׳ ${overMinutes} דק׳`, breached: true };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return { text: `${days} ימים ${remainingHours} שע׳`, breached: false };
  }
  
  return { text: `${hours} שע׳ ${minutes} דק׳`, breached: false };
}

export function generateTicketNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `WK-${y}${m}${d}-${rand}`;
}

export const URGENCY_COLORS = {
  'רגילה': { bg: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  'בינונית': { bg: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  'גבוהה': { bg: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  'קריטית': { bg: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

export const STATUS_COLORS = {
  'פתוחה': { bg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  'שויכה לטיפול': { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'בטיפול': { bg: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  'ממתינה': { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  'טופלה': { bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'נסגרה': { bg: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
};