import { useState, useEffect } from 'react';

export function getLiveSlaDisplay(ticket, now = new Date()) {
  if (ticket.status === 'נסגרה') return { label: 'נסגרה', status: 'closed', pulse: false };
  if (!ticket.sla_deadline || !ticket.sla_minutes) return { label: 'ללא SLA', status: 'none', pulse: false };

  const deadline = new Date(ticket.sla_deadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / 60000);

  if (diffMs <= 0) {
    const overMin = Math.abs(diffMinutes);
    const overH = Math.floor(overMin / 60);
    const overM = overMin % 60;
    const label = overH > 0 ? `חרג ב-${overH}ש׳ ${overM}ד׳` : `חרג ב-${overMin} ד׳`;
    return { label, status: 'breached', pulse: true };
  }

  let criticalThreshold;
  if (ticket.sla_minutes <= 5) criticalThreshold = ticket.sla_minutes;
  else if (ticket.sla_minutes === 10) criticalThreshold = 5;
  else if (ticket.sla_minutes === 20) criticalThreshold = 10;
  else if (ticket.sla_minutes === 30) criticalThreshold = 15;
  else criticalThreshold = 30;

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const label = hours > 0 ? `נותרו ${hours}ש׳ ${mins}ד׳` : `נותרו ${diffMinutes} ד׳`;

  if (diffMinutes <= 5) return { label, status: 'critical', pulse: true };
  if (diffMinutes <= criticalThreshold) return { label, status: 'warning', pulse: false };
  return { label, status: 'ok', pulse: false };
}

const STATUS_CLASSES = {
  ok:       'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning:  'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-orange-100 text-orange-700 border-orange-200',
  breached: 'bg-red-100 text-red-700 border-red-300',
  none:     'bg-slate-100 text-slate-500 border-slate-200',
  closed:   'bg-green-100 text-green-700 border-green-200',
};

export default function LiveSlaBadge({ ticket }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (ticket.status === 'נסגרה') return;
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, [ticket.status]);

  const { label, status, pulse } = getLiveSlaDisplay(ticket, now);
  const cls = STATUS_CLASSES[status] || STATUS_CLASSES.none;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cls} ${pulse ? 'animate-pulse' : ''}`}
    >
      {label}
    </span>
  );
}