import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Sends the real email file of this style to the signed-in user.
export default function TemplateTestButton({ s }) {
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("mailTemplates", { action: "test", template: s.template, variables: s.sample });
      if (data.sent) toast({ title: "מייל הבדיקה נשלח", description: `נשלח אל ${data.to}` });
      else toast({ title: "המייל לא נשלח", description: data.message || data.reason || "הכתובת חסומה לדיוור.", variant: "destructive" });
    } catch (e) {
      toast({ title: "השליחה נכשלה", description: e.response?.data?.error || "נסו שוב בעוד רגע.", variant: "destructive" });
    } finally { setBusy(false); }
  }
  return <Button size="sm" variant="outline" onClick={send} disabled={busy}>
    {busy ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Send className="w-4 h-4 ml-1" />}מייל בדיקה אליי
  </Button>;
}