import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, UrgencyBadge, SlaBadge } from "./TicketStatusBadge";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";

export default function TicketTable({ tickets }) {
  const navigate = useNavigate();

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">אין קריאות להצגה</p>
        <p className="text-sm mt-1">נסה לשנות את הפילטרים או צור קריאה חדשה</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right w-[100px]">מס׳ קריאה</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right w-[70px]">חדר</TableHead>
              <TableHead className="text-right">תקלה</TableHead>
              <TableHead className="text-right w-[120px]">אזור</TableHead>
              <TableHead className="text-right w-[90px]">דחיפות</TableHead>
              <TableHead className="text-right w-[120px]">סטטוס</TableHead>
              <TableHead className="text-right w-[120px]">SLA</TableHead>
              <TableHead className="text-right w-[100px]">אחראי</TableHead>
              <TableHead className="text-right w-[90px]">תאריך</TableHead>
              <TableHead className="w-[30px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map(ticket => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                <TableCell className="font-medium text-sm">{ticket.client_name}</TableCell>
                <TableCell className="text-sm">{ticket.room_number}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{ticket.issue_description}</TableCell>
                <TableCell className="text-xs">{ticket.fault_area}</TableCell>
                <TableCell><UrgencyBadge urgency={ticket.urgency} /></TableCell>
                <TableCell><StatusBadge status={ticket.status} /></TableCell>
                <TableCell><SlaBadge slaTarget={ticket.sla_target} status={ticket.status} /></TableCell>
                <TableCell className="text-sm">{ticket.assigned_to || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(ticket.created_date), "dd/MM HH:mm")}
                </TableCell>
                <TableCell>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}