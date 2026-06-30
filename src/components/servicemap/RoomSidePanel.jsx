import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, AlertTriangle, Clock, Building2, User, Phone, Mail } from 'lucide-react';
import { STATUS_COLORS, PRIORITY_COLORS, getSlaStatus, getTimeRemainingLabel } from '@/lib/slaUtils';
import { ROOM_STATUS_COLORS } from '@/lib/roomServiceStatus';

export default function RoomSidePanel({ room, roomStatus, onClose }) {
  const navigate = useNavigate();
  const { openCount, urgentCount, breachedCount, tickets } = roomStatus;
  const colors = ROOM_STATUS_COLORS[roomStatus.status];

  const { data: tenants = [] } = useQuery({
    queryKey: ['room-tenants-panel', room.room_number],
    queryFn: () => base44.entities.RoomTenant.filter({ room_number: String(room.room_number), matched_room: true }, '-created_date', 20),
    staleTime: 60000,
  });

  const primaryTenant = tenants.find(t => t.is_primary_contact) || tenants[0];

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

      {/* Tenant info */}
      {primaryTenant && (
        <div className="p-4 border-b space-y-1.5 bg-muted/30">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            דייר בחדר
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {primaryTenant.customer_name}
          </div>
          {primaryTenant.company_id && (
            <p className="text-xs text-muted-foreground pr-5">ח.פ: {primaryTenant.company_id}</p>
          )}
          {primaryTenant.phone && (
            <a href={`tel:${primaryTenant.phone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline" dir="ltr">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              {primaryTenant.phone}
            </a>
          )}
          {primaryTenant.email && (
            <a href={`mailto:${primaryTenant.email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate" dir="ltr">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{primaryTenant.email}</span>
            </a>
          )}
          {primaryTenant.desk_count && (
            <p className="text-xs text-muted-foreground pr-5">{primaryTenant.desk_count} עמדות</p>
          )}
        </div>
      )}

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