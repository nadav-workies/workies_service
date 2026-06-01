import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';

export default function RoomCell({ room, roomStatus, isSelected, onClick }) {
  const { status, openCount, breachedCount, urgentCount } = roomStatus;
  const colors = ROOM_STATUS_COLORS[status] || ROOM_STATUS_COLORS.inactive;
  const selected = isSelected;

  const shortLabel = room.room_label
    .replace('CONFERENCE', 'CONF')
    .replace('VIEW', 'VIEW')
    .replace('מורחב', '')
    .replace('מס׳', '')
    .trim();

  return (
    <button
      onClick={onClick}
      title={`${room.room_label} | ${colors.label}${openCount > 0 ? ` | ${openCount} קריאות` : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? '#0f172a' : colors.border,
        color: colors.text,
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? '0 0 0 2px #0f172a' : undefined,
      }}
      className="relative rounded-md border transition-all duration-150 hover:opacity-80 active:scale-95 text-right flex flex-col justify-between p-1 w-full h-full overflow-hidden"
    >
      <span className="text-[10px] font-semibold leading-tight truncate">{shortLabel}</span>
      {openCount > 0 && (
        <div className="flex gap-0.5 flex-wrap mt-0.5">
          {breachedCount > 0 && (
            <span className="bg-red-600 text-white text-[8px] font-bold px-1 rounded-full leading-tight">
              {breachedCount}
            </span>
          )}
          {urgentCount > 0 && (
            <span className="bg-orange-500 text-white text-[8px] font-bold px-1 rounded-full leading-tight">
              {urgentCount}
            </span>
          )}
          {openCount - breachedCount - urgentCount > 0 && (
            <span className="bg-blue-500 text-white text-[8px] font-bold px-1 rounded-full leading-tight">
              {openCount - breachedCount - urgentCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}