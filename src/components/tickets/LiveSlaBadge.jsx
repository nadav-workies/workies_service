import { useState, useEffect } from 'react';
import { getLiveSlaDisplay } from '@/lib/slaAgent';

const STATUS_CLASSES = {
  ok:       'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning:  'bg-orange-100 text-orange-800 border-orange-400',
  critical: 'bg-red-100 text-red-700 border-red-400',
  breached: 'bg-red-200 text-red-800 border-red-500',
  none:     'bg-slate-100 text-slate-500 border-slate-200',
  closed:   'bg-green-100 text-green-700 border-green-200',
  pending:  'bg-slate-100 text-slate-600 border-slate-200',
};

export default function LiveSlaBadge({ ticket, compact = false }) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!ticket || ticket.status === 'נסגרה' || ticket.status === 'הושלם' || ticket.status === 'בוטל') return;
    const interval = setInterval(() => setNowMs(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [ticket?.id, ticket?.status]);

  const { label, status, pulse } = getLiveSlaDisplay(ticket, nowMs);
  const cls = STATUS_CLASSES[status] || STATUS_CLASSES.none;
  const icon =
    status === 'breached' ? '🔴' :
    status === 'critical' ? '🟠' :
    status === 'warning'  ? '⚠️' : null;
  const sizeClass = compact ? 'px-1 py-0 text-[9px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border whitespace-nowrap ${sizeClass} ${cls} ${pulse ? 'animate-pulse' : ''}`}
    >
      {icon && <span className="text-[9px]">{icon}</span>}
      {label}
    </span>
  );
}