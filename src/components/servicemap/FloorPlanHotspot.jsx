import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';

export default function FloorPlanHotspot({ box, label, serviceStatus, selected, onSelect }) {
  const { x, y, width, height } = box;
  const { status, openCount, slaDisplay } = serviceStatus;
  const colors = ROOM_STATUS_COLORS[status] || ROOM_STATUS_COLORS.clear;
  const hasTickets = openCount > 0;
  const description = `${label} · ${hasTickets ? `${openCount} קריאות פתוחות · ${colors.label}` : 'ללא קריאות פתוחות'}${slaDisplay ? ` · ${slaDisplay.label}` : ''}`;
  return <g role="button" tabIndex={0} aria-label={description} aria-pressed={selected} onClick={onSelect}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(); } }}
    className="group cursor-pointer outline-none">
    <title>{description}</title>
    <rect x={x} y={y} width={width} height={height} rx={2} fill={hasTickets ? colors.bg : 'transparent'} fillOpacity={hasTickets ? 0.78 : 0}
      stroke={hasTickets ? colors.border : 'transparent'} strokeWidth={hasTickets ? 2 : 0} />
    <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={2} fill="none" strokeWidth={2.5}
      className={selected ? 'stroke-foreground' : 'stroke-transparent group-hover:stroke-primary group-focus-visible:stroke-primary'} />
    {hasTickets && <g pointerEvents="none">
      {height > 28 && <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" direction="rtl" fontSize={box.number ? 12 : 9} fontWeight={700} fill={colors.text}>{box.number || label}</text>}
      <circle cx={x + width - 9} cy={y + 9} r={8} fill={colors.text} />
      <text x={x + width - 9} y={y + 12} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-primary-foreground">{openCount}</text>
      {(status === 'breached' || status === 'critical') && height > 30 && <text x={x + 8} y={y + height - 5} fontSize={13} fontWeight={900} fill={colors.text}>!</text>}
    </g>}
  </g>;
}