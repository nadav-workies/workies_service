import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import KPICards from "@/components/dashboard/KPICards";
import AreaChartComponent from "@/components/dashboard/AreaChart";
import ClientChart from "@/components/dashboard/ClientChart";
import TicketTable from "@/components/tickets/TicketTable";

export default function Dashboard() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 200),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status !== 'נסגרה');
  const recentOpen = openTickets.slice(0, 10);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">דשבורד מנהל תפעול</h1>
        <p className="text-muted-foreground text-sm mt-1">תמונת מצב בזמן אמת של קריאות השירות</p>
      </div>

      <KPICards tickets={tickets} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AreaChartComponent tickets={tickets} />
        <ClientChart tickets={tickets} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">קריאות פתוחות אחרונות</h2>
        <TicketTable tickets={recentOpen} />
      </div>
    </div>
  );
}