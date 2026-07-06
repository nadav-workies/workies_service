import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "./TicketStatusBadge";
import LiveSlaBadge from "./LiveSlaBadge";
import PrintingBadge, { getPrintingHighlightClass } from "./PrintingBadge";
import RecordActionsMenu from "@/components/admin/RecordActionsMenu";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";

export default function TicketTable({ tickets, user }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-card">
        <p className="text-lg font-medium text-muted-foreground">אין קריאות להצגה</p>
        <p className="text-sm text-muted-foreground mt-1">נסה לשנות פילטרים או פתח קריאה חדשה</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right w-[105px]">מס׳ קריאה</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right w-[65px]">חדר</TableHead>
              <TableHead className="text-right">סוג / תקלה</TableHead>
              <TableHead className="text-right w-[90px]">דחיפות</TableHead>
              <TableHead className="text-right w-[120px]">סטטוס</TableHead>
              <TableHead className="text-right w-[130px]">SLA</TableHead>
              <TableHead className="text-right w-[90px]">אחראי</TableHead>
              {isAdmin && <TableHead className="w-[40px]"></TableHead>}
              <TableHead className="w-[30px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map(ticket => (
              <TableRow
                key={ticket.id}
                className={`cursor-pointer hover:bg-muted/30 transition-colors ${getPrintingHighlightClass(ticket)}`}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <TableCell className="font-mono text-xs">
                  {ticket.ticket_number}
                  {ticket.is_printing_package_request && <PrintingBadge ticket={ticket} className="mt-0.5" />}
                </TableCell>
                <TableCell className="font-medium text-sm">{ticket.customer_name}</TableCell>
                <TableCell className="text-sm">{ticket.room_number}</TableCell>
                <TableCell className="text-sm max-w-[180px]">
                  <p className="font-medium truncate">{ticket.ticket_type || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{ticket.issue_description}</p>
                </TableCell>
                <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                <TableCell><StatusBadge status={ticket.status} /></TableCell>
                <TableCell><LiveSlaBadge ticket={ticket} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{ticket.assigned_to || '—'}</TableCell>
                {isAdmin && (
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <RecordActionsMenu
                      entityName="ServiceTicket"
                      record={ticket}
                      recordType="ticket"
                      user={user}
                      queryKeys={['tickets', 'tickets-sla-report', 'ticket', 'tickets-for-surveys']}
                    />
                  </TableCell>
                )}
                <TableCell><ChevronLeft className="w-4 h-4 text-muted-foreground" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}