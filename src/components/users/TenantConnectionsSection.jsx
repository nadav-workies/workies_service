import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link2 } from "lucide-react";
import { CONNECTION_STATUS_LABELS, CONNECTION_STATUS_COLORS } from "@/lib/communityConfig";

export default function TenantConnectionsSection({ tenant }) {
  const { data: connections = [] } = useQuery({
    queryKey: ["tenant-connections", tenant?.id],
    queryFn: () => base44.entities.CommunityConnectionSuggestion.list("-created_date", 200),
    enabled: !!tenant?.id,
  });

  const relevant = connections.filter(
    (c) => c.customer_a_id === tenant.id || c.customer_b_id === tenant.id ||
      c.customer_a_name === tenant.customer_name || c.customer_b_name === tenant.customer_name
  );

  if (relevant.length === 0) return null;

  return (
    <div className="border rounded-lg p-2 bg-muted/30 space-y-1.5">
      <p className="text-xs font-bold flex items-center gap-1">
        <Link2 className="w-3.5 h-3.5 text-primary" /> חיבורים פוטנציאליים ({relevant.length})
      </p>
      {relevant.slice(0, 5).map((c) => (
        <div key={c.id} className="text-xs flex items-start gap-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${CONNECTION_STATUS_COLORS[c.status] || "bg-gray-100"}`}>
            {CONNECTION_STATUS_LABELS[c.status] || c.status}
          </span>
          <span className="min-w-0">
            <span className="font-medium">{c.customer_a_id === tenant.id || c.customer_a_name === tenant.customer_name ? c.customer_b_name : c.customer_a_name}</span>
            {c.reason && <span className="text-muted-foreground"> — {c.reason}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}