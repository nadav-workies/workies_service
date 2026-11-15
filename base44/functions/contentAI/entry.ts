import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Content-board AI helpers for admins/managers. Task prompts live here; the client sends only the content unit's context.
const NO_INVENT_RULE = `כללים מחייבים: השתמש/י אך ורק במידע שסופק בהקשר. אין להמציא עובדות, נתונים או ציטוטים על הלקוח. אם אין מספיק מקור להמלצה מדויקת — כתוב/כתבי במפורש "חסר מידע ליצירת המלצה מדויקת" וציין/י מה חסר. כתוב/כתבי בעברית.`;

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
const HASHTAGS_SCHEMA = { type: "object", properties: { hashtags: { type: "array", items: { type: "string" } } } };

const TASKS = {
  recommend: { schema: RECOMMENDATIONS_SCHEMA, prompt: "הפק/הפיקי המלצות מעשיות בלבד ליחידת התוכן — זוויות מומלצות, הוק, מבנה מומלץ, מסרים מרכזיים, ממה להימנע, ומידע חסר." },
  write_post: { prompt: "כתוב/כתבי טיוטת תוכן שמתאימה לתוצר ולפלטפורמה שצוינו, בהתבסס אך ורק על ההקשר והמקור. החזר/החזירי את הטקסט בלבד." },
  image_prompt: { prompt: "כתוב/כתבי פרומפט ויזואלי מעשי וברור לתמונה / סטורי / רילס שמתאים ליחידת התוכן (סגנון, סצנה, אווירה, צבעוניות). אל תיצור תמונה — רק פרומפט. החזר/החזירי את הפרומפט בלבד." },
  hashtags: { schema: HASHTAGS_SCHEMA, prompt: "הצע/הציעי האשטגים ומילות מפתח רלוונטיות ליחידת התוכן." },
  improve: { prompt: "שפר/שפרי את ניסוח הטיוטה הנוכחית — בהירות, זרימה והוק חזק — בלי להוסיף עובדות חדשות. החזר/החזירי את הטקסט המשופר בלבד." },
  adapt: { prompt: "התאם/התאימי את הטיוטה הנוכחית לתוצר ולפלטפורמה שצוינו (אורך, טון, מבנה). החזר/החזירי את הטקסט המותאם בלבד." },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const context = String(body.unit_context || '').slice(0, 20000);
    if (!context) return Response.json({ error: 'unit_context is required' }, { status: 400 });

    let prompt;
    let schema;
    if (body.action === 'chat') {
      const thread = Array.isArray(body.thread) ? body.thread.slice(-30) : [];
      if (!thread.length) return Response.json({ error: 'thread is required' }, { status: 400 });
      const history = thread.map((m) => `${m.role === 'user' ? 'משתמשת' : 'עוזר'}: ${String(m.text || '').slice(0, 4000)}`).join('\n');
      prompt = `${context}\n\nהתכתבות על יחידת התוכן הזו בלבד:\n${history}\n\nענה/עני להודעה האחרונה של המשתמשת בהקשר של יחידת תוכן זו בלבד.\n\n${NO_INVENT_RULE}`;
    } else {
      const task = TASKS[body.action];
      if (!task) return Response.json({ error: 'Unknown action' }, { status: 400 });
      prompt = `${context}\n\nמשימה: ${task.prompt}\n\n${NO_INVENT_RULE}`;
      schema = task.schema;
    }

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, ...(schema ? { response_json_schema: schema } : {}) });
    const result = schema ? res : (typeof res === 'string' ? res.trim() : String(res));
    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}