import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/communityConfig";
import { OUTPUT_TYPE_LABELS, SOURCE_TYPE_LABELS } from "@/lib/contentBoardConfig";

export function buildUnitContext(form) {
  const lines = [
    `כותרת: ${form.title || ""}`,
    form.topic ? `נושא: ${form.topic}` : "",
    `תוצר: ${OUTPUT_TYPE_LABELS[form.output_type] || "לא נבחר"}`,
    `אמצעי / מקור: ${SOURCE_TYPE_LABELS[form.source_type] || "לא נבחר"}`,
    form.platform ? `פלטפורמה: ${PLATFORM_LABELS[form.platform] || form.platform}` : "",
    form.related_customer_name ? `לקוח קשור: ${form.related_customer_name}` : "",
    form.source_note ? `ציטוט מקור: ${form.source_note}` : "",
    form.source_text ? `טקסט מקור / תמלול:\n${form.source_text}` : "",
    form.post_draft ? `טיוטת פוסט נוכחית:\n${form.post_draft}` : "",
  ].filter(Boolean);
  return `הקשר יחידת התוכן (וורקיז — חלל עבודה משותף וקהילה עסקית בבאר שבע):\n${lines.join("\n")}`;
}

// Task prompts live in the contentAI backend function.
const ACTIONS = [
  { key: "write_post", label: "כתוב פוסט", field: "post_draft" },
  { key: "image_prompt", label: "צור פרומפט לתמונה", field: "image_prompt" },
  { key: "hashtags", label: "הצע תגיות", field: "hashtags", json: true },
  { key: "improve", label: "שפר ניסוח", field: "post_draft", needsDraft: true },
  { key: "adapt", label: "התאם לפלטפורמה", field: "post_draft", needsDraft: true },
];

const askAI = async (action, form) => (await base44.functions.invoke("contentAI", { action, unit_context: buildUnitContext(form) })).data.result;

export default function ContentAIActions({ form, setForm }) {
  const [busyKey, setBusyKey] = useState(null);

  const runRecommendations = async () => {
    setBusyKey("recommend");
    const res = await askAI("recommend", form);
    setForm((p) => ({ ...p, ai_recommendations: res }));
    setBusyKey(null);
  };

  const run = async (action) => {
    setBusyKey(action.key);
    const res = await askAI(action.key, form);
    if (action.json) setForm((p) => ({ ...p, hashtags: res.hashtags || [] }));
    else setForm((p) => ({ ...p, [action.field]: res }));
    setBusyKey(null);
  };

  const disabled = busyKey !== null || (!form.title && !form.topic);

  return (
    <div className="space-y-1.5">
      <Button size="sm" variant="secondary" className="gap-1.5 text-xs w-full"
        disabled={disabled} onClick={runRecommendations}>
        {busyKey === "recommend" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
        הצע המלצות לתוכן
      </Button>
      <p className="text-xs font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-primary" /> יצירת תוצר (רק בלחיצה)</p>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((a) => (
          <Button key={a.key} size="sm" variant="outline" className="text-xs h-7 gap-1"
            disabled={disabled || (a.needsDraft && !form.post_draft)}
            onClick={() => run(a)}>
            {busyKey === a.key && <Loader2 className="w-3 h-3 animate-spin" />}
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}