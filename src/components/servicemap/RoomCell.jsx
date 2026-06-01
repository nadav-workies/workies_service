import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';

export default function RoomCell({ room, roomStatus, weeklyCount = 0, isSelected, onClick }) {
  const { status, openCount } = roomStatus;
  const colors = ROOM_STATUS_COLORS[status] || ROOM_STATUS_COLORS.inactive;
  const selected = isSelected;
  const isBusy = weeklyCount >= 3; // 3+ קריאות ב-7 ימים

  const shortLabel = room.room_label
    .replace('CONFERENCE', 'CONF')
    .replace('VIEW', 'VIEW')
    .replace('מורחב', '')
    .replace('מס׳', '')
    .trim();

  return (
    <button
      onClick={onClick}
      title={`${room.room_label} | ${colors.label}${openCount > 0 ? ` | ${openCount} קריאות פתוחות` : ''}${isBusy ? ` | עמוס: ${weeklyCount} קריאות ב-7 ימים` : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? '#0f172a' : colors.border,
        color: colors.text,
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? '0 0 0 2px #0f172a' : undefined,
      }}
      className="relative rounded-md border transition-all duration-150 hover:opacity-80 active:scale-95 text-right flex flex-col justify-between p-1 w-full h-full overflow-hidden"
    >
      <div className="flex items-start justify-between gap-0.5">
        <span className="text-[10px] font-semibold leading-tight truncate flex-1">{shortLabel}</span>
        {isBusy && (
          <span className="text-[8px] font-bold bg-amber-500 text-white px-0.5 rounded leading-tight shrink-0" title={`${weeklyCount} קריאות ב-7 ימים`}>
            עמוס
          </span>
        )}
      </div>
      {openCount > 0 && (
        <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded-full leading-tight self-start">
          {openCount}
        </span>
      )}
    </button>
  );
}