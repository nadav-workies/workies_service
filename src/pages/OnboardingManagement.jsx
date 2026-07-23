import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnboardingKPIs from "@/components/onboarding/OnboardingKPIs";
import CreateOnboardingDialog from "@/components/onboarding/CreateOnboardingDialog";
import { TRACK_STATUS_CONFIG } from "@/lib/onboardingTemplate";
import { isManagerOrAdmin } from "@/lib/permissions";

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: "active", label: "פעילים" },
  { key: "at_risk", label: "בסיכון" },
  { key: "completed", label: "הושלמו" },
];

export default function OnboardingManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
      if (!u || !isManagerOrAdmin(u)) navigate("/");
    }).catch(() => { setLoading(false); navigate("/"); });
  }, []);

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["onboarding-tracks"],
    queryFn: () => base44.entities.EmployeeOnboarding.list("-created_date", 100),
    enabled: !!user,
  });

  if (loading || !user) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const filtered = filter === "all" ? tracks : tracks.filter((t) => t.status === filter);

  return (
    <div className="space-y-4 px-1 overflow-x-hidden" dir="rtl">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold">קליטת עובד</h1>
          <p className="text-xs text-muted-foreground">ניהול מסלולי חפיפה וקליטה</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> מסלול חדש
        </Button>
      </div>

      <OnboardingKPIs tracks={tracks} />

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors shrink-0 ${
              filter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">אין מסלולי חפיפה בסינון זה</Card>
      ) : (
        <div className="space-y-2 min-w-0">
          {filtered.map((track) => (
            <Card key={track.id} className="p-3 hover:bg-muted/30 transition-colors cursor-pointer min-w-0"
              onClick={() => navigate(`/onboarding/${track.id}`)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {track.employee_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{track.employee_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${(TRACK_STATUS_CONFIG[track.status] || {}).color || "bg-gray-100"}`}>
                      {(TRACK_STATUS_CONFIG[track.status] || {}).label || track.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span>{track.role_title}</span>
                    <span>·</span>
                    <span>יום {track.current_day || 0}</span>
                    <span>·</span>
                    <span>{track.completed_stages || 0}/{track.total_stages || 0} שלבים</span>
                    {track.average_knowledge_score > 0 && (
                      <><span>·</span><span>ציון: {track.average_knowledge_score}</span></>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-center">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${track.progress_percent || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{track.progress_percent || 0}%</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateOnboardingDialog open={showCreate} onClose={() => setShowCreate(false)} user={user}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["onboarding-tracks"] })} />
    </div>
  );
}