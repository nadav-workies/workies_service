import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Extracts maintenance tasks from an uploaded file/image URL using LLM vision.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const allowed = ['admin', 'manager', 'operations_manager', 'maintenance_manager'];
    if (!allowed.includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const file_url = body?.file_url;
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const prompt = `אתה עוזר תפעולי. נתח את הקובץ/התמונה המצורף וחלץ ממנו רשימת משימות תחזוקה מתוכננות לאיש תחזוקה במשרדי עבודה משותפים.
אם אין תאריך מפורש, השאר את השדה planned_date ריק. אם אין שעה מפורשת, הגדר start_time כ-"09:00".
עבור category השתמש באחת מ: general, electrical, plumbing, cleaning, ac, repairs, inspection, safety, other.
עבור priority השתמש ב: low, medium, high (ברירת מחדל medium).
החזר אך ורק משימות תחזוקה אמיתיות שניתן לבצע. אל תמציא פרטים שאינם מופיעים במסמך.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                priority: { type: "string" },
                location: { type: "string" },
                planned_date: { type: "string" },
                start_time: { type: "string" },
                duration_minutes: { type: "number" }
              }
            }
          }
        }
      }
    });

    return Response.json({ ok: true, tasks: result?.tasks || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}