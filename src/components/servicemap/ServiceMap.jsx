import { useState, useMemo } from 'react';
import { WORKIES_ROOMS } from '@/lib/workiesRooms';
import { getRoomServiceStatus, ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';
import RoomCell from './RoomCell';

// ─── Area groupings for the schematic map ────────────────────────────────────
// Each group renders as a section with a label + grid of rooms
const AREA_GROUPS = [
  {
    key: 'wing_a',
    label: 'כנף A — חדרים 1–25',
    rooms: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25'],
    cols: 6,
  },
  {
    key: 'wing_b',
    label: 'כנף B — חדרים 26–50',
    rooms: ['26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50'],
    cols: 6,
  },
  {
    key: 'wing_c',
    label: 'כנף C — חדרים 51–85',
    rooms: ['51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85'],
    cols: 7,
  },
  {
    key: 'wing_d',
    label: 'כנף D — חדרים 101–105',
    rooms: ['101','102','103','104','105'],
    cols: 5,
  },
];

const ROOM_MAP = Object.fromEntries(WORKIES_ROOMS.map(r => [r.room_number, r]));

export default function ServiceMap({ tickets, onRoomSelect, selectedRoom }) {
  const statusMap = useMemo(() => {
    const map = {};
    WORKIES_ROOMS.forEach(r => {
      map[r.room_number] = getRoomServiceStatus(r.room_number, tickets);
    });
    return map;
  }, [tickets]);

  return (
    <div className="space-y-5" dir="rtl">
      {AREA_GROUPS.map(group => (
        <AreaSection
          key={group.key}
          group={group}
          statusMap={statusMap}
          selectedRoom={selectedRoom}
          onRoomSelect={onRoomSelect}
        />
      ))}
    </div>
  );
}

function AreaSection({ group, statusMap, selectedRoom, onRoomSelect }) {
  const { label, rooms, cols } = group;

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2 border-b pb-1">{label}</p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {rooms.map(rn => {
          const room = ROOM_MAP[rn];
          if (!room) return null;
          const roomStatus = statusMap[rn] || { status: 'clear', openCount: 0, urgentCount: 0, breachedCount: 0, tickets: [] };
          return (
            <div key={rn} style={{ height: 56 }}>
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
  );
}