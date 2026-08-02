import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  CONNECTION_STATUS_LABELS, CONNECTION_STATUS_COLORS, CONFIDENCE_COLORS, CONFIDENCE_LABELS,
} from "@/lib/communityConfig";

export default function ConnectionsTable() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("idea");

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["community-connections"],
    queryFn: () => base44.entities.CommunityConnectionSuggestion.list("-created_date", 200),
  });

  const handleStatusChange = async (conn, newStatus) => {
    await base44.entities.CommunityConnectionSuggestion.update(conn.id, { status: newStatus });
    qc.invalidateQueries({ queryKey: ["community-connections"] });
  };

  const filtered = statusFilter === "all" ? connections : connections.filter((c) => c.status === statusFilter);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card dir="rtl">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-semibold">חיבורים פוטנציאליים ({filtered.length})</h2>
          <div className="flex gap-1 flex-wrap">
            {["idea", "to_review", "approved", "done", "not_relevant", "all"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                {CONNECTION_STATUS_LABELS[s] || "הכל"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">שלב ראשון: הצגה בלבד. לא נשלחים מיילים או הודעות חיבור.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-2 font-semibold">לקוח א׳</th>
                <th className="p-2 font-semibold">לקוח ב׳ / סוג לקוח מתאים</th>
                <th className="p-2 font-semibold">סיבת החיבור</th>
                <th className="p-2 font-semibold">מקור</th>
                <th className="p-2 font-semibold">ביטחון</th>
                <th className="p-2 font-semibold">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">אין חיבורים פוטנציאליים</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="p-2 text-xs font-medium">{c.customer_a_name || "—"}</td>
                  <td className="p-2 text-xs">{c.customer_b_name || "—"}</td>
                  <td className="p-2 text-xs max-w-[250px]">{c.reason}</td>
                  <td className="p-2 text-xs text-muted-foreground italic max-w-[200px] truncate" title={c.source_quote}>
                    {c.source_quote || "—"}
                  </td>
                  <td className="p-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CONFIDENCE_COLORS[c.confidence] || "bg-gray-100"}`}>
                      {CONFIDENCE_LABELS[c.confidence] || c.confidence}
                    </span>
                  </td>
                  <td className="p-2">
                    <select value={c.status}
                      onChange={(e) => handleStatusChange(c, e.target.value)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border-0 ${CONNECTION_STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                      {Object.entries(CONNECTION_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}