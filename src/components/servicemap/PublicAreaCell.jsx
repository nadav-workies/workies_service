import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';
import LiveSlaBadge from '@/components/tickets/LiveSlaBadge';

export default function PublicAreaCell({ area, areaStatus, isSelected, onClick }) {
  const { status, openCount, mostUrgentTicket } = areaStatus;
  const colors = ROOM_STATUS_COLORS[status] || ROOM_STATUS_COLORS.inactive;
  const shouldPulse = status === 'breached' || status === 'critical';
  const isCorridor = area.requires_near_room;
  const isWc = area.requires_location;

  return (
    <button
      onClick={onClick}
      title={`${area.area_label} | ${colors.label}${openCount > 0 ? ` | ${openCount} קריאות פתוחות` : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: isSelected ? '#0f172a' : colors.border,
        color: colors.text,
        borderWidth: isSelected ? 2 : 1,
        boxShadow: isSelected ? '0 0 0 2px #0f172a' : undefined,
      }}
      className={`relative rounded-md border transition-all duration-150 hover:opacity-90 active:scale-95 text-right flex flex-col justify-between p-1 w-full h-full overflow-hidden ${shouldPulse ? 'animate-pulse' : ''} ${isCorridor ? 'border-dashed' : ''}`}
    >
      <div className="flex items-start justify-between gap-0.5">
        <span className="text-[10px] font-semibold leading-tight truncate flex-1">{area.area_label}</span>
        {openCount > 0 && (
          <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded-full leading-tight shrink-0">
            {openCount}
          </span>
        )}
      </div>

      <span className="text-[8px] text-muted-foreground leading-none">
        {isCorridor ? 'מעבר' : isWc ? 'שירותים' : 'ציבורי'}
      </span>

      {mostUrgentTicket && (
        <div className="mt-0.5 scale-[0.82] origin-right">
          <LiveSlaBadge ticket={mostUrgentTicket} compact />
        </div>
      )}
    </button>
  );
}