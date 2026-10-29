import { WORKIES_ROOMS, WORKIES_PUBLIC_AREAS } from '@/lib/workiesRooms';
import { getPublicAreaServiceStatus } from '@/lib/roomServiceStatus';
import { getFloorPlanRoomStatus } from '@/lib/floorPlanStatus';
import { FLOOR_PLAN_IMAGE, FLOOR_PLAN_ROOMS, FLOOR_PLAN_PUBLIC_AREAS, FLOOR_PLAN_ROOM_NAMES } from '@/components/servicemap/floorPlanLayout';
import FloorPlanHotspot from '@/components/servicemap/FloorPlanHotspot';
import PublicAreaCell from '@/components/servicemap/PublicAreaCell';

const ROOM_MAP = Object.fromEntries(WORKIES_ROOMS.map(room => [room.room_number, { ...room,
  room_label: FLOOR_PLAN_ROOM_NAMES[room.room_number] || `משרד ${room.room_number.padStart(2, '0')}`,
  room_area: room.room_number === '50' ? 'אולפן פודקאסט' : room.room_number === '74' ? 'חדרי ישיבות' : room.room_area,
}]));
const PUBLIC_MAP = Object.fromEntries(WORKIES_PUBLIC_AREAS.map(area => [area.area_key, area]));
const CORRIDORS = WORKIES_PUBLIC_AREAS.filter(area => area.requires_near_room);

export default function ServiceMap({ tickets, onRoomSelect, selectedRoom, onPublicAreaSelect, selectedPublicArea }) {
  return <div className="space-y-3" dir="rtl">
    <p className="text-xs text-muted-foreground">לחצו על חדר או אזור להצגת הקריאות. צבעי השרטוט מציינים את סוג החלל; חיווי צבעוני ומספר מציינים קריאות פתוחות.</p>
    <div className="overflow-x-auto rounded-lg border" dir="ltr">
      <svg viewBox="30 138 964 486" className="block w-full min-w-[800px]" aria-label="מפת המתחם לפי השרטוט המעודכן, אוקטובר 2026">
        <image href={FLOOR_PLAN_IMAGE} x="0" y="0" width="1024" height="750" />
        {FLOOR_PLAN_ROOMS.map(box => {
          const room = ROOM_MAP[box.number];
          const serviceStatus = getFloorPlanRoomStatus(box.number, tickets);
          return <FloorPlanHotspot key={box.number} box={box} label={room.room_label} serviceStatus={serviceStatus}
            selected={selectedRoom?.room_number === box.number} onSelect={() => onRoomSelect(room, serviceStatus)} />;
        })}
        {FLOOR_PLAN_PUBLIC_AREAS.map(box => {
          const area = PUBLIC_MAP[box.key];
          const serviceStatus = getPublicAreaServiceStatus(box.key, tickets);
          return <FloorPlanHotspot key={box.id} box={box} label={area.area_label} serviceStatus={serviceStatus}
            selected={selectedPublicArea?.area_key === box.key} onSelect={() => onPublicAreaSelect?.(area, serviceStatus)} />;
        })}
      </svg>
    </div>
    <p className="text-xs text-muted-foreground">שירותים, לאונג׳ וטרקלין: החיווי משותף לכל המיקומים מאותו סוג. מספר הקריאות מופיע בתוך העיגול; ! מציין חיווי קריטי או חריגה.</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {CORRIDORS.map(area => { const serviceStatus = getPublicAreaServiceStatus(area.area_key, tickets);
        return <div key={area.area_key} className="h-14"><PublicAreaCell area={area} areaStatus={serviceStatus}
          isSelected={selectedPublicArea?.area_key === area.area_key} onClick={() => onPublicAreaSelect?.(area, serviceStatus)} /></div>;
      })}
    </div>
  </div>;
}