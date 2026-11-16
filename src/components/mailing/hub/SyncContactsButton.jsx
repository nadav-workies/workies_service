import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Pulls every landing-page lead and active tenant into the contacts database.
export default function SyncContactsButton({ onDone }) {
  const [busy, setBusy] = useState(false);
  async function sync() {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("mailContacts", { action: "sync" });
      const added = Object.values(data.result).reduce((a, r) => a + r.added, 0);
      toast({ title: "הסנכרון הושלם", description: `${added} אנשי קשר חדשים נוספו מהלידים ומהדיירים.` });
      onDone();
    } catch {
      toast({ title: "הסנכרון נכשל", description: "נסו שוב בעוד רגע.", variant: "destructive" });
    } finally { setBusy(false); }
  }
  return <Button variant="outline" onClick={sync} disabled={busy}>
    <RefreshCw className={`w-4 h-4 ml-1 ${busy ? "animate-spin" : ""}`} />{busy ? "מסנכרן..." : "סנכרון מלידים"}
  </Button>;
}