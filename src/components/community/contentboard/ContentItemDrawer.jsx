import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, CheckCircle2, Trash2 } from "lucide-react";
import ContentAIActions from "./ContentAIActions";
import ContentAIChat from "./ContentAIChat";
import AIRecommendationsView from "./AIRecommendationsView";
import ContentAttachments from "./ContentAttachments";
import ExecutionControls from "./ExecutionControls";
import { PLATFORM_LABELS, getWeekStart } from "@/lib/communityConfig";
import {
  WORK_STATUS_ORDER, WORK_STATUS_LABELS, normalizeStatus,
  OUTPUT_TYPE_LABELS, SOURCE_TYPE_LABELS, FULL_DAY_ORDER,
} from "@/lib/contentBoardConfig";

const EMPTY = {
  title: "", topic: "", output_type: "post", source_type: "", planned_date: "",
  platform: "", related_customer_name: "", status: "idea", source_text: "",
  post_draft: "", image_prompt: "", hashtags: [], final_content: "", source_note: "",
  ai_recommendations: null, attachments: [],
};

export default function ContentItemDrawer({ item, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState(EMPTY);
  const [thread, setThread] = useState([]);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...EMPTY, ...item, status: normalizeStatus(item.status), hashtags: item.hashtags || [], attachments: item.attachments || [] });
      setThread(item.ai_thread_notes || []);
    }
  }, [item?.id]);

  if (!item) return null;
  const isNew = !item.id;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const selectCls = "h-9 w-full px-2 rounded-md border bg-background text-sm";
  const isValid = form.title.trim() && form.output_type && form.source_type && form.planned_date;

  const buildPayload = () => {
    const payload = {
      title: form.title, topic: form.topic || form.title, output_type: form.output_type,
      source_type: form.source_type, planned_date: form.planned_date,
      platform: form.platform || undefined, related_customer_name: form.related_customer_name,
      status: form.status, source_text: form.source_text, post_draft: form.post_draft,
      image_prompt: form.image_prompt, hashtags: form.hashtags, source_note: form.source_note,
      attachments: form.attachments || [],
    };
    if (form.ai_recommendations) payload.ai_recommendations = form.ai_recommendations;
    if (form.planned_date) {
      const d = new Date(form.planned_date + "T00:00:00");
      payload.week_start_date = getWeekStart(d);
      payload.day_of_week = FULL_DAY_ORDER[d.getDay()];
    }
    return payload;
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    const payload = buildPayload();
    let saved;
    if (isNew) saved = await base44.entities.WeeklyContentIdea.create(payload);
    else saved = await base44.entities.WeeklyContentIdea.update(item.id, payload);
    setSaving(false);
    onSaved(saved || { ...item, ...payload });
  };

  const handleApprove = async () => {
    const content = form.final_content || form.post_draft;
    if (!content || isNew) return;
    setApproving(true);
    const me = await base44.auth.me();
    const payload = {
      ...buildPayload(),
      final_content: content,
      final_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: me.email,
      status: "approved",
    };
    await base44.entities.WeeklyContentIdea.update(item.id, payload);
    setForm((p) => ({ ...p, final_content: content, final_approved: true, status: "approved" }));
    setApproving(false);
    onSaved({ ...item, ...payload });
  };

  const handleDelete = async () => {
    if (isNew) return;
    await base44.entities.WeeklyContentIdea.delete(item.id);
    onDeleted();
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto p-4" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle className="text-base">{isNew ? "יחידת תוכן חדשה" : "כרטיס תוכן"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">כותרת *</label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">תוצר *</label>
              <select className={`${selectCls} mt-1`} value={form.output_type} onChange={(e) => set("output_type", e.target.value)}>
                {Object.entries(OUTPUT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">אמצעי / מקור *</label>
              <select className={`${selectCls} mt-1`} value={form.source_type} onChange={(e) => set("source_type", e.target.value)}>
                <option value="">בחרו אמצעי...</option>
                {Object.entries(SOURCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">תאריך מתוכנן *</label>
              <Input type="date" value={form.planned_date || ""} onChange={(e) => set("planned_date", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">סטטוס</label>
              <select className={`${selectCls} mt-1`} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {WORK_STATUS_ORDER.map((s) => <option key={s} value={s}>{WORK_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">פלטפורמה</label>
              <select className={`${selectCls} mt-1`} value={form.platform} onChange={(e) => set("platform", e.target.value)}>
                <option value="">ללא</option>
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">לקוח קשור</label>
              <Input value={form.related_customer_name} onChange={(e) => set("related_customer_name", e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">נושא</label>
              <Input value={form.topic} onChange={(e) => set("topic", e.target.value)} className="mt-1" />
            </div>
          </div>

          {form.source_note && (
            <div className="bg-muted/40 border rounded-lg p-2">
              <p className="text-[10px] font-bold text-muted-foreground">ציטוט מקור</p>
              <p className="text-xs mt-0.5">{form.source_note}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium">שייך מקור תוכן — טקסט מקור / תמלול / הערות</label>
            <Textarea rows={4} value={form.source_text} onChange={(e) => set("source_text", e.target.value)}
              placeholder="הדביקו כאן תמלול ראיון, סיכום פגישה, תוצאות סקר או כל טקסט מקור..."
              className="mt-1 text-sm" />
          </div>

          <ContentAttachments attachments={form.attachments} onChange={(a) => set("attachments", a)} />

          <ContentAIActions form={form} setForm={setForm} />

          <AIRecommendationsView rec={form.ai_recommendations} />

          <div>
            <label className="text-xs font-medium">טיוטת תוכן</label>
            <Textarea rows={6} value={form.post_draft} onChange={(e) => set("post_draft", e.target.value)} className="mt-1 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium">פרומפט לתמונה / ויז׳ואל</label>
            <Textarea rows={3} value={form.image_prompt} onChange={(e) => set("image_prompt", e.target.value)} className="mt-1 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium">תגיות / האשטגים (מופרדות בפסיק)</label>
            <Input value={(form.hashtags || []).join(", ")}
              onChange={(e) => set("hashtags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
              className="mt-1" />
          </div>

          {isNew ? (
            <p className="text-xs text-muted-foreground">שמרו את היחידה כדי לפתוח שיחת AI עליה.</p>
          ) : (
            <ContentAIChat itemId={item.id} form={form} thread={thread} onThreadChange={setThread} />
          )}

          {form.final_approved && form.final_content && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-[10px] font-bold text-green-700">תוצר סופי מאושר {form.approved_by ? `· ${form.approved_by}` : ""}</p>
              <p className="text-xs mt-1 whitespace-pre-wrap">{form.final_content}</p>
            </div>
          )}

          {!isNew && form.final_approved && (
            <ExecutionControls item={{ ...item, ...form }} onChanged={onSaved} />
          )}

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <Button size="sm" onClick={handleSave} disabled={saving || !isValid} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} שמור
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
              onClick={handleApprove} disabled={approving || isNew || !(form.final_content || form.post_draft)}>
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} אשר תוצר סופי
            </Button>
            {!isNew && (
              <Button size="sm" variant="ghost" className="text-red-600 gap-1.5 mr-auto" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> מחק
              </Button>
            )}
          </div>
          {!isValid && <p className="text-[10px] text-muted-foreground">שדות חובה: כותרת, תוצר, אמצעי, תאריך מתוכנן.</p>}
          <p className="text-[10px] text-muted-foreground">עד לחיצה על "אשר תוצר סופי" — הכל נחשב טיוטה.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}