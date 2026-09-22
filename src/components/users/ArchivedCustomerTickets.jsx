import { Ticket } from "lucide-react";
import { format } from "date-fns";
import { tenantRoomDisplay } from "@/lib/tenantStatus";

export default function ArchivedCustomerTickets({ tenant, tickets }) {
  return (
    <div className="space-y-1" dir="rtl">
      <p className="text-xs font-semibold mb-2">
        קריאות שירות — {tenant.customer_name} · {tenantRoomDisplay(tenant)} ({tickets.length})
      </p>
      {tickets.map(t => (
        <div key={t.id} className="flex items-center gap-3 text-xs py-1 border-b border-border/50 last:border-0 flex-wrap">
          <Ticket className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium">{t.ticket_number || "—"}</span>
          <span className="text-muted-foreground">{t.ticket_type || t.area || "—"}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
            {t.status || "—"}
          </span>
          {t.opened_at && (
            <span className="text-muted-foreground">{format(new Date(t.opened_at), "dd/MM/yy")}</span>
          )}
          {t.issue_description && (
            <span className="text-muted-foreground truncate max-w-xs">· {t.issue_description}</span>
          )}
        </div>
      ))}
    </div>
  );
}