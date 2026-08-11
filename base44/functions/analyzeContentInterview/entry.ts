import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    ai_summary: { type: "string", description: "סיכום כללי של תוכנית התוכן לשבוע" },
    extracted_content: {
      type: "array",
      description: "תוכן נוסף שחולץ מהתובנות והשיחות, מעבר למה שהמנהל כבר מילא",
      items: {
        type: "object",
        properties: {
          topic: { type: "string", description: "נושא/כותרת התוכן" },
          angle: { type: "string", description: "זווית טיפול / מסר" },
          platform: { type: "string", enum: ["facebook", "instagram", "linkedin", "story", "whatsapp_community", "newsletter"] },
          reasoning: { type: "string", description: "מדוע תוכן זה רלוונטי ולמה פלטפורמה זו" },
          day: { type: "string", enum: ["sunday", "monday", "tuesday", "wednesday", "thursday"] },
          customer_ref: { type: "string", description: "לקוח רלוונטי אם ידוע" }
        }
      }
    },
    platform_recommendations: {
      type: "array",
      description: "המלצות לפלטפורמות — איפה להעלות איזה סוג תוכן",
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["facebook", "instagram", "linkedin", "story", "whatsapp_community", "newsletter"] },
          why: { type: "string", description: "מדוע פלטפורמה זו מתאימה השבוע" },
          content_types: { type: "array", items: { type: "string" }, description: "סוגי תוכן מומלצים לפלטפורמה" },
          best_days: { type: "array", items: { type: "string" }, description: "ימים מומלצים לפרסום" }
        }
      }
    },
    timing_suggestions: { type: "string", description: "המלצות תזמון כלליות לפרסום במהלך השבוע" }
  }
};

function buildPrompt(interview, insightsContext, conversationsContext) {
  return `אתה סוכן AI לניהול תוכן קהילתי בקואורקינג "Workies". 
קיבלת ראיון מנהל תוכן לשבוע הקרוב, ומידע מתובנות ושיחות לקוחות.

משימתך:
1. לחלץ תוכן נוסף לתוכנית — רעיונות שמשתלבים עם מה שהמנהל כבר מילא, מבוסס על התובנות והשיחות.
2. להמליץ לאן להעלות — איזו פלטפורמה מתאימה לאיזה סוג תוכן, ולמה.
3. לתת המלצות תזמון לאורך השבוע.

--- נתוני הראיון ---
נושא מרכזי: ${interview.weekly_theme || "—"}
קהל יעד: ${interview.target_audience || "—"}
מסרים מרכזיים: ${(interview.key_messages || []).join("; ") || "—"}
יעדי תוכן: ${interview.content_goals || "—"}
אירועים/הדגשים קרובים: ${interview.upcoming_highlights || "—"}
לקוחות במיקוד: ${(interview.spotlight_customers || []).join("; ") || "—"}
פלטפורמות במיקוד: ${(interview.platforms_focus || []).join("; ") || "—"}
הערות נוספות: ${interview.additional_notes || "—"}

--- תובנות לקוחות עדכניות ---
${insightsContext}

--- סיכומי שיחות אחרונות ---
${conversationsContext}

הנחיות:
- תוכן "customer_specific" = מותאם ללקוח ספציפי (מזכיר/מציג לקוח). תוכן כללי = ערך לקהילה כולה.
- המלצות פלטפורמה: LinkedIn לתוכן מקצועי, Instagram לתוכן ויזואלי/סיפורים, Facebook לקהילה, Story לעדכונים מהירים, WhatsApp Community לקהילה פנימית, Newsletter לערך עומק.
- תן 5-10 רעיונות תוכן חדשים שמשלימים את מה שהמנהל כבר מילא.
- המלצות פלטפורמה צריכות להיות ממוקדות ופרקטיות.
- כל התשובות בעברית.`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { interview_id, interview_data } = body;

    if (!interview_id && !interview_data) {
      return Response.json({ error: "Missing interview_id or interview_data" }, { status: 400 });
    }

    let interview = interview_data;
    if (interview_id) {
      interview = await base44.entities.ContentInterview.get(interview_id);
    }

    if (!interview) {
      return Response.json({ error: "Interview not found" }, { status: 404 });
    }

    // Fetch recent insights for context
    const insights = await base44.entities.CustomerInsight.list("-created_date", 50);
    const insightsContext = insights.slice(0, 30).map((ins) => {
      const parts = [`[${ins.insight_type}] ${ins.title}`];
      if (ins.customer_name) parts.push(`לקוח: ${ins.customer_name}`);
      if (ins.content) parts.push(ins.content);
      if (ins.source_quote) parts.push(`ציטוט: "${ins.source_quote}"`);
      return parts.join(" | ");
    }).join("\n");

    // Fetch recent conversations for context
    const conversations = await base44.entities.CustomerConversation.list("-conversation_date", 20);
    const conversationsContext = conversations.slice(0, 15).map((c) => {
      const parts = [`${c.conversation_date} — ${c.conversation_title || ""}`];
      if (c.customer_name) parts.push(`לקוח: ${c.customer_name}`);
      if (c.ai_summary) parts.push(c.ai_summary);
      return parts.join(" | ");
    }).join("\n");

    const prompt = buildPrompt(interview, insightsContext || "אין תובנות עדכניות", conversationsContext || "אין שיחות עדכניות");

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: ANALYSIS_SCHEMA,
    });

    const analysis = llmResponse.data || llmResponse;

    const updateData = {
      ai_summary: analysis.ai_summary || "",
      ai_extracted_content: analysis.extracted_content || [],
      ai_platform_recommendations: analysis.platform_recommendations || [],
      ai_timing_suggestions: analysis.timing_suggestions || "",
      ai_analyzed_at: new Date().toISOString(),
    };

    if (interview_id) {
      await base44.entities.ContentInterview.update(interview_id, updateData);
      const updated = await base44.entities.ContentInterview.get(interview_id);
      return Response.json(updated);
    }

    return Response.json({ ...interview, ...updateData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}