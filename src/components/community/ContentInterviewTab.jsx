import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Save, Plus, X, Wand2, Check, Lightbulb, Send, Upload, ClipboardPaste } from "lucide-react";
import { getWeekStart } from "@/lib/communityConfig";

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "story", label: "Story" },
  { value: "whatsapp_community", label: "WhatsApp קהילה" },
  { value: "newsletter", label: "Newsletter" },
];

const PLATFORM_LABELS = Object.fromEntries(PLATFORM_OPTIONS.map((p) => [p.value, p.label]));

const DAY_LABELS = {
  sunday: "ראשון", monday: "שני", tuesday: "שלישי", wednesday: "רביעי", thursday: "חמישי",
};
const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const EMPTY_INTERVIEW = {
  weekly_theme: "",
  target_audience: "",
  key_messages: [],
  content_goals: "",
  upcoming_highlights: "",
  spotlight_customers: [],
  platforms_focus: [],
  additional_notes: "",
};

export default function ContentInterviewTab() {
  const qc = useQueryClient();
  const weekStart = getWeekStart();
  const [form, setForm] = useState(EMPTY_INTERVIEW);
  const [newMessage, setNewMessage] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const { data: existingInterview, isLoading } = useQuery({
    queryKey: ["content-interview", weekStart],
    queryFn: async () => {
      const list = await base44.entities.ContentInterview.filter({ week_start_date: weekStart }, "-created_date", 1);
      return list[0] || null;
    },
    enabled: !!weekStart,
  });

  // Sync form when existing interview loads
  useEffect(() => {
    if (existingInterview) {
      setForm({
        weekly_theme: existingInterview.weekly_theme || "",
        target_audience: existingInterview.target_audience || "",
        key_messages: existingInterview.key_messages || [],
        content_goals: existingInterview.content_goals || "",
        upcoming_highlights: existingInterview.upcoming_highlights || "",
        spotlight_customers: existingInterview.spotlight_customers || [],
        platforms_focus: existingInterview.platforms_focus || [],
        additional_notes: existingInterview.additional_notes || "",
      });
      setAiResult({
        ai_summary: existingInterview.ai_summary || "",
        ai_extracted_content: existingInterview.ai_extracted_content || [],
        ai_platform_recommendations: existingInterview.ai_platform_recommendations || [],
        ai_timing_suggestions: existingInterview.ai_timing_suggestions || "",
      });
    }
  }, [existingInterview]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const addMessage = () => {
    if (!newMessage.trim()) return;
    update("key_messages", [...form.key_messages, newMessage.trim()]);
    setNewMessage("");
  };
  const removeMessage = (i) => update("key_messages", form.key_messages.filter((_, idx) => idx !== i));

  const addCustomer = () => {
    if (!newCustomer.trim()) return;
    update("spotlight_customers", [...form.spotlight_customers, newCustomer.trim()]);
    setNewCustomer("");
  };
  const removeCustomer = (i) => update("spotlight_customers", form.spotlight_customers.filter((_, idx) => idx !== i));

  const togglePlatform = (p) => {
    update("platforms_focus", form.platforms_focus.includes(p)
      ? form.platforms_focus.filter((x) => x !== p)
      : [...form.platforms_focus, p]);
  };

  const handleSave = async () => {
    const payload = { week_start_date: weekStart, session_date: new Date().toISOString(), status: "active", ...form };
    if (existingInterview?.id) {
      await base44.entities.ContentInterview.update(existingInterview.id, form);
    } else {
      await base44.entities.ContentInterview.create(payload);
    }
    qc.invalidateQueries({ queryKey: ["content-interview", weekStart] });
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Save first if there are unsaved changes
      let interviewId = existingInterview?.id;
      if (!interviewId) {
        const payload = { week_start_date: weekStart, session_date: new Date().toISOString(), status: "active", ...form };
        const created = await base44.entities.ContentInterview.create(payload);
        interviewId = created.id;
        qc.invalidateQueries({ queryKey: ["content-interview", weekStart] });
      } else {
        await base44.entities.ContentInterview.update(interviewId, form);
      }

      const res = await base44.functions.invoke("analyzeContentInterview", { interview_id: interviewId });
      const data = res.data || res;
      setAiResult({
        ai_summary: data.ai_summary || "",
        ai_extracted_content: data.ai_extracted_content || [],
        ai_platform_recommendations: data.ai_platform_recommendations || [],
        ai_timing_suggestions: data.ai_timing_suggestions || "",
      });
      qc.invalidateQueries({ queryKey: ["content-interview", weekStart] });
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAdoptContent = async (item) => {
    setAdopting(true);
    try {
      await base44.entities.WeeklyContentIdea.create({
        week_start_date: weekStart,
        day_of_week: item.day || "sunday",
        platform: item.platform || "facebook",
        topic: item.topic,
        content_type: "workies_general",
        source_note: item.reasoning || "",
        status: "idea",
      });
      qc.invalidateQueries({ queryKey: ["community-content-ideas", weekStart] });
    } catch (e) {
      console.error(e);
    } finally {
      setAdopting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleAutoFill = async () => {
    if (!transcriptText.trim() && !selectedFile) return;
    setExtracting(true);
    try {
      let fileUrl = null;
      if (selectedFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: selectedFile });
        fileUrl = uploadRes.file_url || uploadRes.data?.file_url;
      }
      const res = await base44.functions.invoke("extractInterviewFromTranscript", {
        transcript_text: transcriptText || undefined,
        file_url: fileUrl || undefined,
      });
      const data = res.data || res;
      setForm((prev) => ({
        ...prev,
        weekly_theme: data.weekly_theme || prev.weekly_theme,
        target_audience: data.target_audience || prev.target_audience,
        key_messages: [...new Set([...prev.key_messages, ...(data.key_messages || [])])],
        content_goals: data.content_goals || prev.content_goals,
        upcoming_highlights: data.upcoming_highlights || prev.upcoming_highlights,
        spotlight_customers: [...new Set([...prev.spotlight_customers, ...(data.spotlight_customers || [])])],
        platforms_focus: [...new Set([...prev.platforms_focus, ...(data.platforms_focus || [])])],
      }));
      setShowTranscript(false);
      setTranscriptText("");
      setSelectedFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setExtracting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold">ראיון מנהל תוכן — שבוע {weekStart}</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            סיוע AI
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> שמור
          </Button>
        </div>
      </div>

      {/* Auto-fill from transcript / file */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <ClipboardPaste className="w-4 h-4 text-primary" /> מילוי אוטומטי מתמלול / קובץ
            </h3>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowTranscript(!showTranscript)}>
              {showTranscript ? "סגור" : "פתח"}
            </Button>
          </div>
          {showTranscript && (
            <div className="space-y-2">
              <Textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="הדביקו כאן את תמלול הראיון..."
                rows={5}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <label className="cursor-pointer">
                  <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-transparent text-xs hover:bg-accent cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> העלה קובץ
                  </span>
                </label>
                {selectedFile && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{selectedFile.name}</span>}
                <Button size="sm" className="gap-1.5 mr-auto" onClick={handleAutoFill} disabled={extracting || (!transcriptText.trim() && !selectedFile)}>
                  {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  מילוי אוטומטי
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Structured questions */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-primary" /> שאלות מובנות
            </h3>

            <div>
              <Label className="text-xs">נושא מרכזי השבוע</Label>
              <Input value={form.weekly_theme} onChange={(e) => update("weekly_theme", e.target.value)}
                placeholder="לדוגמה: קהילה, פריון, חדשנות..." className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">קהל יעד</Label>
              <Input value={form.target_audience} onChange={(e) => update("target_audience", e.target.value)}
                placeholder="למי מיועד התוכן השבוע?" className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">יעדי תוכן</Label>
              <Textarea value={form.content_goals} onChange={(e) => update("content_goals", e.target.value)}
                placeholder="מה רוצים להשיג השבוע?" rows={2} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">אירועים / הדגשים קרובים</Label>
              <Textarea value={form.upcoming_highlights} onChange={(e) => update("upcoming_highlights", e.target.value)}
                placeholder="אירועים, עדכונים, השקות..." rows={2} className="mt-1" />
            </div>

            {/* Key messages */}
            <div>
              <Label className="text-xs">מסרים מרכזיים</Label>
              <div className="flex gap-1.5 mt-1">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMessage()} placeholder="הוסף מסר..." />
                <Button size="icon" variant="outline" onClick={addMessage}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {form.key_messages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.key_messages.map((m, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                      {m} <button onClick={() => removeMessage(i)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Spotlight customers */}
            <div>
              <Label className="text-xs">לקוחות להדגשה</Label>
              <div className="flex gap-1.5 mt-1">
                <Input value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomer()} placeholder="שם לקוח..." />
                <Button size="icon" variant="outline" onClick={addCustomer}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {form.spotlight_customers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.spotlight_customers.map((c, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                      {c} <button onClick={() => removeCustomer(i)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Platforms focus */}
            <div>
              <Label className="text-xs">פלטפורמות במיקוד</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PLATFORM_OPTIONS.map((p) => (
                  <button key={p.value} onClick={() => togglePlatform(p.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.platforms_focus.includes(p.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">הערות נוספות</Label>
              <Textarea value={form.additional_notes} onChange={(e) => update("additional_notes", e.target.value)}
                placeholder="הערות חופשיות..." rows={2} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Right: AI recommendations */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-primary" /> סיוע AI אוטומטי
                </h3>
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {analyzing ? "מנתח..." : "חלץ מחדש"}
                </Button>
              </div>

              {!aiResult?.ai_summary && !analyzing && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  לחצו "סיוע AI" כדי לחלץ תוכן נוסף והמלצות פלטפורמה מתוך התובנות והשיחות.
                </p>
              )}

              {aiResult?.ai_summary && (
                <div className="bg-muted/40 rounded-lg p-2.5">
                  <p className="text-xs font-semibold mb-1">סיכום</p>
                  <p className="text-xs text-muted-foreground">{aiResult.ai_summary}</p>
                </div>
              )}

              {aiResult?.ai_timing_suggestions && (
                <div>
                  <p className="text-xs font-semibold mb-1">המלצות תזמון</p>
                  <p className="text-xs text-muted-foreground">{aiResult.ai_timing_suggestions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform recommendations */}
          {aiResult?.ai_platform_recommendations?.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-primary" /> המלצות פלטפורמה
                </h3>
                {aiResult.ai_platform_recommendations.map((rec, i) => (
                  <div key={i} className="border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {PLATFORM_LABELS[rec.platform] || rec.platform}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.why}</p>
                    {rec.content_types?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {rec.content_types.map((t, j) => (
                          <span key={j} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                    {rec.best_days?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">ימים מומלצים:</span>
                        {rec.best_days.map((d, j) => (
                          <span key={j} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                            {DAY_LABELS[d] || d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Extracted content */}
          {aiResult?.ai_extracted_content?.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> תוכן שחולץ ({aiResult.ai_extracted_content.length})
                </h3>
                {aiResult.ai_extracted_content.map((item, i) => (
                  <div key={i} className="border rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.topic}</p>
                      <Button size="sm" variant="outline" className="gap-1 text-xs shrink-0"
                        onClick={() => handleAdoptContent(item)} disabled={adopting}>
                        <Check className="w-3 h-3" /> העבר ללוח
                      </Button>
                    </div>
                    {item.angle && <p className="text-xs text-muted-foreground">זווית: {item.angle}</p>}
                    {item.reasoning && <p className="text-xs text-muted-foreground italic">{item.reasoning}</p>}
                    <div className="flex gap-1 flex-wrap">
                      {item.platform && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                          {PLATFORM_LABELS[item.platform] || item.platform}
                        </span>
                      )}
                      {item.day && (
                        <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                          {DAY_LABELS[item.day] || item.day}
                        </span>
                      )}
                      {item.customer_ref && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full">
                          {item.customer_ref}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}