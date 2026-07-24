import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function OnboardingAIAssistant({ track, stages, isManager }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const stagesSummary = stages
        .map((s) => `- יום ${s.day_number}: ${s.title} (סטטוס: ${s.status}${s.quiz_score != null ? `, ציון: ${s.quiz_score}` : ""})`)
        .join("\n");
      const prompt = `אתה עוזר וירטואלי לתהליך חפיפה בחברת Workies.
פרטי החפיפה: שם: ${track.employee_name}, תפקיד: ${track.role_title}, התקדמות: ${track.progress_percent}%, סטטוס: ${track.status}, שלבים שהושלמו: ${track.completed_stages}/${track.total_stages}, תאריך תחילה: ${track.start_date}, תאריך סיום מתוכנן: ${track.planned_end_date}.

שלבי החפיפה:
${stagesSummary}

השאלה נשאלה על ידי ${isManager ? "מנהל" : "המשתמש/ת"}: ${question}

ענה בעברית, בקצרה ובצורה ברורה ומועילה. אם השאלה לא קשורה לחפיפה, בקש להבהיר.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((m) => [...m, { role: "assistant", text: typeof res === "string" ? res : JSON.stringify(res) }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "מצטער, לא הצלחתי לענות כעת. נסו שוב מאוחר יותר." }]);
    }
    setLoading(false);
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center gap-2 hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 text-right">
          <p className="font-medium text-sm">עוזר AI</p>
          <p className="text-xs text-muted-foreground">שאלו שאלות על תהליך החפיפה</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t">
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-2">דוגמאות לשאלות:</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {["איזה שלבים נותרו?", "מה הציון הממוצע שלי?", "מה צריך לעשות ביום הראשו�ון?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm p-2.5 rounded-lg whitespace-pre-wrap ${m.role === "user" ? "bg-primary/10 mr-6" : "bg-muted ml-6"}`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
              placeholder="כתבו שאלה..."
              className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              disabled={loading}
            />
            <Button size="icon" onClick={sendQuestion} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}