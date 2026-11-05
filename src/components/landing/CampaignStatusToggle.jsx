import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCampaignValidity from "@/hooks/useCampaignValidity";
import { formatEndDate } from "@/lib/campaignValidity";
import { Switch } from "@/components/ui/switch";

export default function CampaignStatusToggle({ campaign, canEdit }) {
  const { data, active, enabled, isPending } = useCampaignValidity(campaign);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const client = useQueryClient();
  async function toggle(value) {
    setBusy(true); setError("");
    try {
      if (data.id) await base44.entities.CampaignValidity.update(data.id, { is_enabled: value });
      else await base44.entities.CampaignValidity.create({ campaign, end_date: data.end_date || "", is_enabled: value });
      await client.invalidateQueries({ queryKey: ["campaign-validity", campaign] });
    } catch { setError("העדכון נכשל. נסו שוב."); }
    finally { setBusy(false); }
  }
  if (isPending) return <p role="status" className="text-sm">טוענים סטטוס…</p>;
  const note = !enabled ? "העמוד כבוי ידנית, ההרשמה סגורה" : active ? `פתוח להרשמה · ${formatEndDate(data.end_date)}` : `התוקף הסתיים ב־${formatEndDate(data.end_date)}`;
  return <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3">
    <div className="min-w-0">
      <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} /><h2 className="font-bold">{active ? "העמוד פעיל" : "העמוד סגור"}</h2></div>
      <p className="text-sm text-muted-foreground mt-1">{note}</p>
      {!canEdit && <p className="text-xs text-muted-foreground">רק אדמין יכול להדליק או לכבות את העמוד.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
    <Switch checked={enabled} onCheckedChange={toggle} disabled={!canEdit || busy} aria-label="הדלקה או כיבוי של עמוד הנחיתה" />
  </div>;
}