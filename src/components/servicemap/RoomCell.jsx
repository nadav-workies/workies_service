import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';
import LiveSlaBadge from '@/components/tickets/LiveSlaBadge';
import PrintingBadge from '@/components/tickets/PrintingBadge';

export default function RoomCell({ room, roomStatus, isSelected, onClick }) {
  const { status, openCount, mostUrgentTicket } = roomStatus;
  const colors = ROOM_STATUS_COLORS[status] || ROOM_STATUS_COLORS.inactive;
  const shouldPulse = status === 'breached' || status === 'critical';

  const shortLabel = room.room_label
    .replace('CONFERENCE', 'CONF')
    .replace('מורחב', '')
    .replace('מס׳', '')
    .trim();

  return (
    <button
      onClick={onClick}
      title={`${room.room_label} | ${colors.label}${openCount > 0 ? ` | ${openCount} קריאות פתוחות` : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: isSelected ? '#0f172a' : colors.border,
        color: colors.text,
        borderWidth: isSelected ? 2 : 1,
        boxShadow: isSelected ? '0 0 0 2px #0f172a' : undefined,
      }}
      className={`relative rounded-md border transition-all duration-150 hover:opacity-90 active:scale-95 text-right flex flex-col justify-between p-1 w-full h-full overflow-hidden ${shouldPulse ? 'animate-pulse' : ''}`}
    >
      {/* שם חדר + מספר קריאות */}
      <div className="flex items-start justify-between gap-0.5">
        <span className="text-[10px] font-semibold leading-tight truncate flex-1">{shortLabel}</span>
        {openCount > 0 && (
          <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded-full leading-tight shrink-0">
            {openCount}
          </span>
        )}
      </div>

      {/* SLA חי — דרך LiveSlaBadge */}
      {mostUrgentTicket && (
        <div className="mt-0.5 scale-[0.82] origin-right">
          <LiveSlaBadge ticket={mostUrgentTicket} compact />
        </div>
      )}

      {/* תג חבילת הדפסה דחופה */}
      {mostUrgentTicket?.is_printing_package_request && (
        <div className="absolute bottom-0 left-0 right-0">
          <PrintingBadge ticket={mostUrgentTicket} />
        </div>
      )}
    </button>
  );
}