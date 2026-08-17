import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/communityConfig";
import { OUTPUT_TYPE_LABELS, SOURCE_TYPE_LABELS } from "@/lib/contentBoardConfig";

export const NO_INVENT_RULE = `כללים מחייבים: השתמש/י אך ורק במידע שסופק בהקשר. אין להמציא עובדות, נתונים או ציטוטים על הלקוח. אם אין מספיק מקור להמלצה מדויקת — כתוב/כתבי במפורש "חסר מידע ליצירת המלצה מדויקת" וציין/י מה חסר. כתוב/כתבי בעברית.`;

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

const RECOMMENDATIONS_SCHEMA = {
  type: "object",
  properties: {
    recommended_angles: { type: "array", items: { type: "string" } },
    recommended_hook: { type: "string" },
    recommended_structure: { type: "string" },
    key_messages: { type: "array", items: { type: "string" } },
    what_not_to_say: { type: "array", items: { type: "string" } },
    missing_information: { type: "array", items: { type: "string" } },
  },
};

const ACTIONS = [
  { key: "write_post", label: "כתוב פוסט", field: "post_draft", prompt: "כתוב/כתבי טיוטת תוכן שמתאימה לתוצר ולפלטפורמה שצוינו, בהתבסס אך ורק על ההקשר והמקור. החזר/החזירי את הטקסט בלבד." },
  { key: "image_prompt", label: "צור פרומפט לתמונה", field: "image_prompt", prompt: "כתוב/כתבי פרומפט ויזואלי מעשי וברור לתמונה / סטורי / רילס שמתאים ליחידת התוכן (סגנון, סצנה, אווירה, צבעוניות). אל תיצור תמונה — רק פרומפט. החזר/החזירי את הפרומפט בלבד." },
  { key: "hashtags", label: "הצע תגיות", field: "hashtags", json: true, prompt: "הצע/הציעי האשטגים ומילות מפתח רלוונטיות ליחידת התוכן." },
  { key: "improve", label: "שפר ניסוח", field: "post_draft", needsDraft: true, prompt: "שפר/שפרי את ניסוח הטיוטה הנוכחית — בהירות, זרימה והוק חזק — בלי להוסיף עובדות חדשות. החזר/החזירי את הטקסט המשופר בלבד." },
  { key: "adapt", label: "התאם לפלטפורמה", field: "post_draft", needsDraft: true, prompt: "התאם/התאימי את הטיוטה הנוכחית לתוצר ולפלטפורמה שצוינו (אורך, טון, מבנה). החזר/החזירי את הטקסט המותאם בלבד." },
];

export default function ContentAIActions({ form, setForm }) {
  const [busyKey, setBusyKey] = useState(null);

  const runRecommendations = async () => {
    setBusyKey("recommend");
    const prompt = `${buildUnitContext(form)}\n\nמשימה: הפק/הפיקי המלצות מעשיות בלבד ליחידת התוכן — זוויות מומלצות, הוק, מבנה מומלץ, מסרים מרכזיים, ממה להימנע, ומידע חסר.\n\n${NO_INVENT_RULE}`;
    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: RECOMMENDATIONS_SCHEMA });
    setForm((p) => ({ ...p, ai_recommendations: res }));
    setBusyKey(null);
  };

  const run = async (action) => {
    setBusyKey(action.key);
    const prompt = `${buildUnitContext(form)}\n\nמשימה: ${action.prompt}\n\n${NO_INVENT_RULE}`;
    if (action.json) {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: { hashtags: { type: "array", items: { type: "string" } } } },
      });
      setForm((p) => ({ ...p, hashtags: res.hashtags || [] }));
    } else {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setForm((p) => ({ ...p, [action.field]: typeof res === "string" ? res.trim() : String(res) }));
    }
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