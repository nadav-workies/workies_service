import { useMemo } from 'react';
import { WORKIES_ROOMS, WORKIES_PUBLIC_AREAS } from '@/lib/workiesRooms';
import { getRoomServiceStatus, getPublicAreaServiceStatus, ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';
import RoomCell from './RoomCell';
import PublicAreaCell from './PublicAreaCell';

const AREA_GROUPS = [
  { key: 'wing_a', label: 'כנף A — 1–25',  rooms: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25'] },
  { key: 'wing_b', label: 'כנף B — 26–50', rooms: ['26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50'] },
  { key: 'wing_c', label: 'כנף C — 51–85', rooms: ['51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85'] },
  { key: 'wing_d', label: 'כנף D — 101–105', rooms: ['101','102','103','104','105'] },
];

const ROOM_MAP = Object.fromEntries(WORKIES_ROOMS.map(r => [r.room_number, r]));

export default function ServiceMap({ tickets, onRoomSelect, selectedRoom, onPublicAreaSelect, selectedPublicArea }) {
  const statusMap = useMemo(() => {
    const map = {};
    WORKIES_ROOMS.forEach(r => {
      map[r.room_number] = getRoomServiceStatus(r.room_number, tickets);
    });
    return map;
  }, [tickets]);

  const publicAreaStatusMap = useMemo(() => {
    const map = {};
    WORKIES_PUBLIC_AREAS.forEach(a => {
      map[a.area_key] = getPublicAreaServiceStatus(a.area_key, tickets);
    });
    return map;
  }, [tickets]);

  return (
    <div className="space-y-3" dir="rtl">
      {AREA_GROUPS.map(group => (
        <div key={group.key}>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 border-b pb-0.5">{group.label}</p>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
          >
            {group.rooms.map(rn => {
              const room = ROOM_MAP[rn];
              if (!room) return null;
              const roomStatus = statusMap[rn] || { status: 'clear', openCount: 0, urgentCount: 0, breachedCount: 0, tickets: [], mostUrgentTicket: null, slaDisplay: null };
              return (
                <div key={rn} style={{ height: 52 }}>
                  <RoomCell
                    room={room}
                    roomStatus={roomStatus}
                    isSelected={selectedRoom?.room_number === rn}
                    onClick={() => onRoomSelect(room, roomStatus)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Public Areas */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 border-b pb-0.5">אזורים ציבוריים</p>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
        >
          {WORKIES_PUBLIC_AREAS.map(area => {
            const areaStatus = publicAreaStatusMap[area.area_key] || { status: 'clear', openCount: 0, urgentCount: 0, breachedCount: 0, tickets: [], mostUrgentTicket: null, slaDisplay: null };
            return (
              <div key={area.area_key} style={{ height: 52 }}>
                <PublicAreaCell
                  area={area}
                  areaStatus={areaStatus}
                  isSelected={selectedPublicArea?.area_key === area.area_key}
                  onClick={() => onPublicAreaSelect?.(area, areaStatus)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}