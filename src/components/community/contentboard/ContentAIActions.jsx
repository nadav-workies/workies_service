import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/communityConfig";
import { CONTENT_FORMAT_LABELS } from "@/lib/contentBoardConfig";

export const NO_INVENT_RULE = `כללים מחייבים: השתמש/י אך ורק במידע שסופק בהקשר. אין להמציא עובדות, נתונים או ציטוטים על הלקוח. אין להציג משהו כאילו הלקוח אמר אותו ללא מקור. אם חסר מידע מהותי — ציין/י במפורש מה חסר. כתוב/כתבי בעברית.`;

export function buildUnitContext(form) {
  const lines = [
    `נושא התוכן: ${form.topic || form.title || ""}`,
    form.title ? `כותרת: ${form.title}` : "",
    `פלטפורמה: ${PLATFORM_LABELS[form.platform] || form.platform || "לא נבחרה"}`,
    `סוג תוכן: ${CONTENT_FORMAT_LABELS[form.content_format] || "לא נבחר"}`,
    form.related_customer_name ? `לקוח קשור: ${form.related_customer_name}` : "",
    form.source_note ? `מקור / ציטוט מתוך שיחה: ${form.source_note}` : "",
    form.notes ? `הערות המשתמשת: ${form.notes}` : "",
    form.post_draft ? `טיוטת פוסט נוכחית:\n${form.post_draft}` : "",
  ].filter(Boolean);
  return `הקשר יחידת התוכן (וורקיז — חלל עבודה משותף וקהילה עסקית בבאר שבע):\n${lines.join("\n")}`;
}

const ACTIONS = [
  { key: "write_post", label: "כתוב פוסט", field: "post_draft", prompt: "כתוב/כתבי טיוטת פוסט לפלטפורמה ולסוג התוכן שצוינו, בהתבסס אך ורק על ההקשר. החזר/החזירי את טקסט הפוסט בלבד." },
  { key: "image_prompt", label: "צור פרומפט לתמונה", field: "image_prompt", prompt: "כתוב/כתבי פרומפט ויזואלי מעשי וברור לתמונה / רילס / קרוסלה שמתאים ליחידת התוכן (סגנון, סצנה, אווירה, אנשים, צבעוניות). אל תיצור תמונה — רק פרומפט. החזר/החזירי את הפרומפט בלבד." },
  { key: "hashtags", label: "הצע תגיות", field: "hashtags", json: true, prompt: "הצע/הציעי האשטגים, מילות מפתח וקטגוריות תוכן רלוונטיות ליחידת התוכן." },
  { key: "improve", label: "שפר טקסט", field: "post_draft", needsDraft: true, prompt: "שפר/שפרי את טיוטת הפוסט הנוכחית — בהירות, זרימה והוק חזק — בלי להוסיף עובדות חדשות. החזר/החזירי את הטקסט המשופר בלבד." },
  { key: "shorten", label: "קצר טקסט", field: "post_draft", needsDraft: true, prompt: "קצר/קצרי את טיוטת הפוסט הנוכחית תוך שמירה על המסר המרכזי. החזר/החזירי את הטקסט המקוצר בלבד." },
  { key: "adapt", label: "התאם לפלטפורמה", field: "post_draft", needsDraft: true, prompt: "התאם/התאימי את טיוטת הפוסט הנוכחית לפלטפורמה ולסוג התוכן שצוינו (אורך, טון, מבנה, שימוש באימוג׳ים לפי הנהוג בפלטפורמה). החזר/החזירי את הטקסט המותאם בלבד." },
];

export default function ContentAIActions({ form, setForm }) {
  const [busyKey, setBusyKey] = useState(null);

  const run = async (action) => {
    setBusyKey(action.key);
    const prompt = `${buildUnitContext(form)}\n\nמשימה: ${action.prompt}\n\n${NO_INVENT_RULE}`;
    if (action.json) {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: { hashtags: { type: "array", items: { type: "string" } } },
        },
      });
      setForm((p) => ({ ...p, hashtags: res.hashtags || [] }));
    } else {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setForm((p) => ({ ...p, [action.field]: typeof res === "string" ? res.trim() : String(res) }));
    }
    setBusyKey(null);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-primary" /> פעולות AI (רק בלחיצה)</p>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((a) => (
          <Button key={a.key} size="sm" variant="outline" className="text-xs h-7 gap-1"
            disabled={busyKey !== null || (a.needsDraft && !form.post_draft) || (!form.topic && !form.title)}
            onClick={() => run(a)}>
            {busyKey === a.key && <Loader2 className="w-3 h-3 animate-spin" />}
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}