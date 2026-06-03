import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, PriorityBadge, SlaBadge } from "./TicketStatusBadge";
import { format } from "date-fns";
import { MapPin, Clock, ChevronLeft } from "lucide-react";

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="font-semibold text-sm truncate">{ticket.customer_name}</p>
            <p className="text-sm text-muted-foreground truncate">{ticket.issue_description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ticket.area}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(ticket.created_date), "dd/MM HH:mm")}</span>
              <SlaBadge ticket={ticket} status={ticket.status} />
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}