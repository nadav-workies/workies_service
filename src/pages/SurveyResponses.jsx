import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Star, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function RatingBadge({ rating }) {
  if (!rating) return <span className="text-muted-foreground text-xs">—</span>;
  const color = rating >= 9 ? "bg-emerald-100 text-emerald-700" : rating >= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}><Star className="w-3 h-3" />{rating}/10</span>;
}

export default function SurveyResponses() {
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState("all");
  const [filterAssigned, setFilterAssigned] = useState("all");

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["survey-responses"],
    queryFn: () => base44.entities.SurveyResponse.list("-submitted_at", 200),
  });

  const filtered = responses.filter(r => {
    if (filterRating === "low" && Number(r.rating) > 5) return false;
    if (filterRating === "high" && Number(r.rating) < 9) return false;
    if (filterAssigned !== "all" && r.assigned_to !== filterAssigned) return false;
    return true;
  });

  const assignees = [...new Set(responses.map(r => r.assigned_to).filter(Boolean))];

  const avgRating = responses.filter(r => r.rating).length
    ? (responses.filter(r => r.rating).reduce((s, r) => s + Number(r.rating), 0) / responses.filter(r => r.rating).length).toFixed(1)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">סקרי שירות</h1>
          <p className="text-sm text-muted-foreground">
            {responses.length} משובים התקבלו
            {avgRating && ` | ממוצע ${avgRating}/10`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="דירוג" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הדירוגים</SelectItem>
            <SelectItem value="low">נמוך (1-5)</SelectItem>
            <SelectItem value="high">גבוה (9-10)</SelectItem>
          </SelectContent>
        </Select>
        {assignees.length > 0 && (
          <Select value={filterAssigned} onValueChange={setFilterAssigned}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="אחראי" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל האחראים</SelectItem>
              {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">טוען...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">אין משובים</p>
            <p className="text-sm text-muted-foreground">לא התקבלו משובים עדיין.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">תאריך</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">קריאה</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">לקוח</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">חדר</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">אחראי</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">דירוג</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">הערה</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {r.submitted_at ? format(new Date(r.submitted_at), "dd/MM/yy HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.ticket_number}</td>
                      <td className="px-4 py-2.5">{r.customer_name || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{r.room_label || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{r.assigned_to || "—"}</td>
                      <td className="px-4 py-2.5"><RatingBadge rating={r.rating} /></td>
                      <td className="px-4 py-2.5 text-xs max-w-[200px] truncate text-muted-foreground">{r.comment || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(`/tickets/${r.ticket_id}`)}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}