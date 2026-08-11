import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    weekly_theme: { type: "string", description: "הנושא המרכזי שעולה מהראיון" },
    target_audience: { type: "string", description: "קהל היעד המוזכר" },
    key_messages: { type: "array", items: { type: "string" }, description: "מסרים מרכזיים" },
    content_goals: { type: "string", description: "יעדי תוכן" },
    upcoming_highlights: { type: "string", description: "אירועים או הדגשים קרובים" },
    spotlight_customers: { type: "array", items: { type: "string" }, description: "לקוחות שמוזכרים להדגשה" },
    platforms_focus: {
      type: "array",
      items: { type: "string", enum: ["facebook", "instagram", "linkedin", "story", "whatsapp_community", "newsletter"] },
      description: "פלטפורמות שמוזכרות"
    }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { transcript_text, file_url } = body;

    if (!transcript_text && !file_url) {
      return Response.json({ error: "Missing transcript_text or file_url" }, { status: 400 });
    }

    const basePrompt = `אתה סוכן AI שמנתח תמלול של ראיון מנהל תוכן וממלא שדות מובנים.
קרא את התוכן וחלץ את השדות הבאים בעברית:
- weekly_theme: הנושא המרכזי שעולה מהראיון
- target_audience: קהל היעד המוזכר
- key_messages: מסרים מרכזיים (מערך של משפטים קצרים)
- content_goals: יעדי תוכן
- upcoming_highlights: אירועים או הדגשים קרובים
- spotlight_customers: לקוחות/חברות שמוזכרים להדגשה (מערך שמות)
- platforms_focus: פלטפורמות שמוזכרות (מתוך: facebook, instagram, linkedin, story, whatsapp_community, newsletter)

אם שדה לא מוזכר בתוכן, החזר רשומה ריקה או מערך ריק. החזר JSON בלבד.`;

    const llmInput = {
      prompt: basePrompt,
      response_json_schema: EXTRACTION_SCHEMA,
    };

    if (file_url) {
      llmInput.file_urls = [file_url];
    }
    if (transcript_text) {
      llmInput.prompt = `${basePrompt}\n\n--- תמלול הראיון ---\n${transcript_text}`;
    }

    const llmResponse = await base44.integrations.Core.InvokeLLM(llmInput);
    const result = llmResponse.data || llmResponse;

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}