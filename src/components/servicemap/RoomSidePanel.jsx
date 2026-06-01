import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, AlertTriangle, Clock } from 'lucide-react';
import { STATUS_COLORS, PRIORITY_COLORS, getSlaStatus, getTimeRemainingLabel } from '@/lib/slaUtils';
import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';

export default function RoomSidePanel({ room, roomStatus, onClose }) {
  const navigate = useNavigate();
  const { openCount, urgentCount, breachedCount, tickets } = roomStatus;
  const colors = ROOM_STATUS_COLORS[roomStatus.status];

  const handleOpenTicket = () => {
    const params = new URLSearchParams({
      room_number: room.room_number,
      room_label: room.room_label,
      room_area: room.room_area,
      location_type: 'room',
    });
    navigate(`/tickets/new?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div>
          <p className="text-xs text-muted-foreground">חדר</p>
          <h3 className="font-bold text-base leading-tight">{room.room_label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{room.room_area}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b">
        <StatBox label="פתוחות" value={openCount} color="blue" />
        <StatBox label="דחופות" value={urgentCount} color="orange" />
        <StatBox label="חריגות" value={breachedCount} color="red" />
      </div>

      {/* Tickets list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין קריאות פתוחות</p>
        ) : (
          tickets.map(t => <TicketRow key={t.id} ticket={t} />)
        )}
      </div>

      {/* CTA */}
      <div className="p-4 border-t">
        <Button className="w-full gap-2" onClick={handleOpenTicket}>
          <Plus className="w-4 h-4" />
          פתח קריאה לחדר זה
        </Button>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-lg p-2 text-center ${colors[color]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px]">{label}</p>
    </div>
  );
}

function TicketRow({ ticket }) {
  const navigate = useNavigate();
  const slaStatus = getSlaStatus(ticket);
  const timeLeft = getTimeRemainingLabel(ticket.sla_deadline);

  return (
    <button
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="w-full text-right border rounded-lg p-2.5 hover:bg-muted/50 transition-colors space-y-1"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</span>
        <Badge className={`text-[10px] px-1.5 ${PRIORITY_COLORS[ticket.priority]}`}>
          {ticket.priority}
        </Badge>
      </div>
      <p className="text-xs font-medium leading-tight line-clamp-2">{ticket.issue_description}</p>
      <div className="flex items-center justify-between gap-2">
        <Badge className={`text-[10px] px-1.5 ${STATUS_COLORS[ticket.status]}`}>
          {ticket.status}
        </Badge>
        {ticket.sla_deadline && (
          <span className={`text-[10px] flex items-center gap-0.5 ${timeLeft.breached ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
            {timeLeft.breached ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
            {timeLeft.text}
          </span>
        )}
      </div>
    </button>
  );
}