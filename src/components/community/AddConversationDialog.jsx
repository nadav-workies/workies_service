import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import {
  CONVERSATION_TYPES, CONVERSATION_TYPE_LABELS, AI_ANALYSIS_STATUS_LABELS,
} from "@/lib/communityConfig";
import { useQueryClient } from "@tanstack/react-query";

export default function AddConversationDialog({ tenant, onClose, onAnalyzed }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    conversation_date: today,
    conversation_title: "",
    conversation_type: "general",
    raw_text: "",
  });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.conversation_title.trim() || !form.raw_text.trim()) {
      setError("נא למלא כותרת ותוכן השיחה");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        tenant_id: tenant.id,
        customer_name: tenant.customer_name,
        contact_name: tenant.contact_name || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        room_code: tenant.room_code || "",
        room_number: tenant.room_number || "",
        conversation_date: form.conversation_date,
        conversation_title: form.conversation_title,
        conversation_type: form.conversation_type,
        raw_text: form.raw_text,
        ai_analysis_status: "not_analyzed",
      };
      const conv = await base44.entities.CustomerConversation.create(payload);
      setSaving(false);
      return conv;
    } catch (e) {
      setError(e.message || "שגיאה בשמירה");
      setSaving(false);
      return null;
    }
  };

  const handleAnalyze = async () => {
    const conv = await handleSave();
    if (!conv) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("analyzeCustomerConversation", {
        conversation_id: conv.id,
        tenant_id: tenant.id,
        raw_text: form.raw_text,
        customer_context: {
          customer_name: tenant.customer_name,
          room_code: tenant.room_code || "",
          existing_tags: [],
          previous_insights: [],
        },
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setResult(data);
      qc.invalidateQueries({ queryKey: ["customer-conversations", tenant.id] });
      qc.invalidateQueries({ queryKey: ["customer-insights", tenant.id] });
      qc.invalidateQueries({ queryKey: ["community-insights"] });
      qc.invalidateQueries({ queryKey: ["community-content-ideas"] });
      qc.invalidateQueries({ queryKey: ["community-connections"] });
      onAnalyzed?.();
    } catch (e) {
      setError(e.message || "שגיאה בניתוח AI");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClose = () => {
    if (result) {
      qc.invalidateQueries({ queryKey: ["customer-conversations", tenant.id] });
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            סיכום שיחה — {tenant.customer_name}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>הניתוח הושלם · {result.insights_created} תובנות נשמרו · {result.content_ideas_created} רעיונות תוכן · {result.connections_created} חיבורים</span>
            </div>
            {result.analysis?.summary && (
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-bold mb-1">תקציר</p>
                <p>{result.analysis.summary}</p>
              </div>
            )}
            {result.analysis?.facts?.length > 0 && (
              <div>
                <p className="font-bold text-sm mb-1">עובדות שזוהו</p>
                <ul className="list-disc pr-4 space-y-1 text-sm">
                  {result.analysis.facts.map((f, i) => (
                    <li key={i}>
                      {f.content}
                      {f.source_quote && <span className="text-muted-foreground text-xs"> — "{f.source_quote}"</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.analysis?.missing_information?.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-2 text-sm">
                <p className="font-bold text-amber-700 mb-1">מידע חסר</p>
                <ul className="list-disc pr-4 space-y-0.5">
                  {result.analysis.missing_information.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>תאריך שיחה</Label>
                <Input type="date" value={form.conversation_date}
                  onChange={(e) => handleChange("conversation_date", e.target.value)} />
              </div>
              <div>
                <Label>סוג שיחה</Label>
                <select className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                  value={form.conversation_type}
                  onChange={(e) => handleChange("conversation_type", e.target.value)}>
                  {CONVERSATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>כותרת שיחה</Label>
              <Input value={form.conversation_title}
                onChange={(e) => handleChange("conversation_title", e.target.value)}
                placeholder="לדוגמה: שיחת היכרות עם דייר חדש" />
            </div>
            <div>
              <Label>תמלול / סיכום גולמי</Label>
              <Textarea value={form.raw_text}
                onChange={(e) => handleChange("raw_text", e.target.value)}
                placeholder="הדביקו תמלול מלא או הקלידו סיכום קצר..."
                className="min-h-[200px]" />
              <p className="text-xs text-muted-foreground mt-1">
                ניתן להדביק תמלול ארוך או סיכום קצר. ה-AI ינתח את הטקסט ויחלץ תובנות.
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>סגור</Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} disabled={saving || analyzing}>
                ביטול
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={saving || analyzing}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור בלבד"}
              </Button>
              <Button onClick={handleAnalyze} disabled={saving || analyzing || !form.raw_text.trim() || !form.conversation_title.trim()}
                className="gap-2 flex-1">
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? "מנתח..." : "נתח עם AI"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}