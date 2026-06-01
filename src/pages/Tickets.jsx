import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketTable from "@/components/tickets/TicketTable";

export default function Tickets() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "הכל",
    urgency: "הכל",
    sla: "הכל",
    area: "הכל",
    search: "",
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 500),
  });

  const filtered = tickets.filter(t => {
    if (filters.status !== "הכל" && t.status !== filters.status) return false;
    if (filters.urgency !== "הכל" && t.urgency !== filters.urgency) return false;
    if (filters.area !== "הכל" && t.fault_area !== filters.area) return false;
    if (filters.sla !== "הכל") {
      const now = new Date();
      const target = new Date(t.sla_target);
      if (filters.sla === "חריגה" && target >= now && t.status !== 'נסגרה') return false;
      if (filters.sla === "בזמן" && (target < now || t.status === 'נסגרה')) return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !t.client_name?.toLowerCase().includes(s) &&
        !t.room_number?.toLowerCase().includes(s) &&
        !t.issue_description?.toLowerCase().includes(s) &&
        !t.ticket_number?.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">קריאות שירות</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} קריאות</p>
        </div>
        <Button onClick={() => navigate("/tickets/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          קריאה חדשה
        </Button>
      </div>

      <TicketFilters filters={filters} onChange={setFilters} />
      <TicketTable tickets={filtered} />
    </div>
  );
}