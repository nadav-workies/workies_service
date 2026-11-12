import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCampaignValidity from "@/hooks/useCampaignValidity";
import { Switch } from "@/components/ui/switch";

export default function LeadWebhookToggle({ campaign, canEdit }) {
  const { data, isPending } = useCampaignValidity(campaign);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const client = useQueryClient();
  const on = data?.webhook_enabled !== false;
  async function toggle(value) {
    setBusy(true); setError("");
    try {
      if (data.id) await base44.entities.CampaignValidity.update(data.id, { webhook_enabled: value });
      else await base44.entities.CampaignValidity.create({ campaign, end_date: data.end_date || "", webhook_enabled: value });
      await client.invalidateQueries({ queryKey: ["campaign-validity", campaign] });
    } catch { setError("העדכון נכשל. נסו שוב."); }
    finally { setBusy(false); }
  }
  if (isPending) return null;
  return <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3">
    <div className="min-w-0">
      <h2 className="font-bold">שליחת לידים לווב הוק (Make)</h2>
      <p className="text-sm text-muted-foreground mt-1">{on ? "פעיל: כל ליד חדש נשלח לווב הוק כולל SID של CallBox" : "כבוי: הלידים נשמרים במערכת בלבד"}</p>
      {!canEdit && <p className="text-xs text-muted-foreground">רק אדמין יכול לשנות.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
    <Switch checked={on} onCheckedChange={toggle} disabled={!canEdit || busy} aria-label="הפעלה או כיבוי של שליחה לווב הוק" />
  </div>;
}