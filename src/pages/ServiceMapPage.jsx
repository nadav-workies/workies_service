import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { isManagerOrAdmin } from '@/lib/slaUtils';
import { getRoomServiceStatus } from '@/lib/roomServiceStatus';
import { WORKIES_ROOMS } from '@/lib/workiesRooms';
import ServiceMap from '@/components/servicemap/ServiceMap';
import MapLegend from '@/components/servicemap/MapLegend';
import RoomSidePanel from '@/components/servicemap/RoomSidePanel';
import { Loader2, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVEN_DAYS_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

export default function ServiceMapPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomStatus, setSelectedRoomStatus] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); }).catch(() => setAuthLoading(false));
  }, []);

  // כל הקריאות הפתוחות (לא נסגרו)
  const { data: openTickets = [], isLoading: loadingOpen, refetch, isFetching } = useQuery({
    queryKey: ['service-map-open'],
    queryFn: () => base44.entities.ServiceTicket.list(),
    enabled: !authLoading && isManagerOrAdmin(user),
    refetchInterval: 60000,
    select: (data) => data.filter(t => t.status !== 'נסגרה'),
  });

  // כל קריאות 7 הימים האחרונים לחיווי "עמוס"
  const { data: recentTickets = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['service-map-recent'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 500),
    enabled: !authLoading && isManagerOrAdmin(user),
    refetchInterval: 300000,
    select: (data) => {
      const cutoff = SEVEN_DAYS_AGO();
      return data.filter(t => t.created_date >= cutoff);
    },
  });

  const tickets = openTickets;
  const isLoading = loadingOpen || loadingRecent;

  // חדרים עמוסים: 3+ קריאות ב-7 ימים אחרונים
  const busyRooms = {};
  recentTickets.forEach(t => {
    if (t.room_number) {
      busyRooms[t.room_number] = (busyRooms[t.room_number] || 0) + 1;
    }
  });

  const handleRoomSelect = (room, roomStatus) => {
    if (selectedRoom?.room_number === room.room_number) {
      setSelectedRoom(null);
      setSelectedRoomStatus(null);
    } else {
      setSelectedRoom(room);
      setSelectedRoomStatus(roomStatus);
    }
  };

  // Summary stats
  const stats = {
    withTickets: WORKIES_ROOMS.filter(r => {
      const s = getRoomServiceStatus(r.room_number, tickets);
      return s.openCount > 0;
    }).length,
    breached: WORKIES_ROOMS.filter(r => {
      const s = getRoomServiceStatus(r.room_number, tickets);
      return s.status === 'breached';
    }).length,
    urgent: WORKIES_ROOMS.filter(r => {
      const s = getRoomServiceStatus(r.room_number, tickets);
      return s.status === 'urgent';
    }).length,
    totalOpen: tickets.length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isManagerOrAdmin(user)) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>מסך זה זמין למנהלים בלבד</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            מפת שירות
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">חיווי קריאות שירות לפי חדרים ואזורים</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="קריאות פתוחות סה״כ" value={stats.totalOpen} color="blue" />
        <SummaryCard label="חדרים עם קריאות" value={stats.withTickets} color="blue" />
        <SummaryCard label="חדרים דחופים" value={stats.urgent} color="orange" />
        <SummaryCard label="חדרים בחריגת SLA" value={stats.breached} color="red" />
      </div>

      {/* Legend */}
      <MapLegend />

      {/* Map + side panel */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 bg-card border rounded-xl p-4 overflow-x-auto">
          <ServiceMap
            tickets={tickets}
            busyRooms={busyRooms}
            onRoomSelect={handleRoomSelect}
            selectedRoom={selectedRoom}
          />
        </div>

        {selectedRoom && selectedRoomStatus && (
          <div className="w-80 shrink-0 bg-card border rounded-xl overflow-hidden sticky top-4 max-h-[80vh] flex flex-col">
            <RoomSidePanel
              room={selectedRoom}
              roomStatus={selectedRoomStatus}
              onClose={() => { setSelectedRoom(null); setSelectedRoomStatus(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colorClass = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    green: 'bg-green-50 text-green-700 border-green-100',
  }[color];
  return (
    <div className={`rounded-xl border p-3 text-center ${colorClass}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  );
}