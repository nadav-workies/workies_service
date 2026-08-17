import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { buildUnitContext, NO_INVENT_RULE } from "./ContentAIActions";

export default function ContentAIChat({ itemId, form, thread, onThreadChange }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!msg.trim() || busy) return;
    const userMsg = { role: "user", text: msg.trim(), at: new Date().toISOString() };
    const withUser = [...thread, userMsg];
    onThreadChange(withUser);
    setMsg("");
    setBusy(true);
    const history = withUser.map((m) => `${m.role === "user" ? "משתמשת" : "עוזר"}: ${m.text}`).join("\n");
    const prompt = `${buildUnitContext(form)}\n\nהתכתבות על יחידת התוכן הזו בלבד:\n${history}\n\nענה/עני להודעה האחרונה של המשתמשת בהקשר של יחידת תוכן זו בלבד.\n\n${NO_INVENT_RULE}`;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    const full = [...withUser, { role: "assistant", text: typeof res === "string" ? res.trim() : String(res), at: new Date().toISOString() }];
    onThreadChange(full);
    await base44.entities.WeeklyContentIdea.update(itemId, { ai_thread_notes: full });
    setBusy(false);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold flex items-center gap-1">
        <MessageCircle className="w-3.5 h-3.5 text-primary" /> שיחה עם AI על יחידת התוכן
      </p>
      {thread.length > 0 && (
        <div className="border rounded-lg p-2 max-h-56 overflow-y-auto space-y-1.5 bg-muted/20">
          {thread.map((m, i) => (
            <div key={i} className={`text-xs rounded-lg p-2 whitespace-pre-wrap ${m.role === "user" ? "bg-primary/10 mr-4" : "bg-card border ml-4"}`}>
              {m.text}
            </div>
          ))}
          {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />}
        </div>
      )}
      <div className="flex gap-1.5">
        <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="תהפוך את זה ליותר אישי / תתאים ללינקדאין / תחדד את ההוק..."
          className="flex-1 h-8 px-2 rounded-md border bg-background text-xs" />
        <Button size="sm" className="h-8 px-2" onClick={send} disabled={busy || !msg.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}