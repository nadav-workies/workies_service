import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          content: { type: "string" },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    business_profile: {
      type: "object",
      properties: {
        business_domain: {
          type: "object",
          properties: {
            value: { type: "string" },
            source_quote: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          }
        },
        expertise: {
          type: "object",
          properties: {
            value: { type: "string" },
            source_quote: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          }
        },
        target_customers: {
          type: "object",
          properties: {
            value: { type: "string" },
            source_quote: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          }
        }
      }
    },
    needs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    content_ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          platform_suggestion: { type: "string", enum: ["facebook", "instagram", "linkedin", "story", "whatsapp_community", "newsletter"] },
          content_type: { type: "string", enum: ["customer_specific", "workies_general"] },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    connection_ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          reason: { type: "string" },
          what_to_look_for: { type: "string" },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    follow_up_actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          owner_hint: { type: "string", enum: ["service", "community", "manager"] },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    suggested_tags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tag: { type: "string" },
          reason: { type: "string" },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    missing_information: {
      type: "array",
      items: { type: "string" }
    }
  }
};

function buildPrompt(rawText, customerContext) {
  return `אתה מנתח שיחות לקוחות מקצועי במתחם עבודה משותף (קואורקינג). 
תפקידך לנתח סיכום שיחה או תמלול עם לקוח/דייר ולחלץ תובנות עסקיות שימושיות לדשבורד קהילה ותוכן.

כללים קשיחים:
1. נתח רק על בסיס הטקסט שסופק והקשר הלקוח הקיים. אל תמציא עובדות.
2. אם מידע לא נאמר במפורש, כתוב "לא זוהה מתוך השיחה".
3. כל תובנה משמעותית חייבת לכלול source_quote קצר מתוך השיחה (ציטוט ישיר או פרפרזה קרובה).
4. הפרד בין עובדה, השערה, והמלצה.
5. אל תייצר תובנות כלליות ובנאליות (כמו "הלקוח רוצה לגדול" אם זה לא נאמר במפורש).
6. העדף מעט תובנות מדויקות על הרבה תובנות חלשות.
7. אם הטקסט קצר מדי או חסר מידע מהותי, ציין זאת במפורש במערך missing_information.
8. כל רמות הביטחון: high = נאמר במפורש, medium = משתמע בבירור, low = השערה בלבד.
9. התובנות צריכות להיות שימושיות למנהלת קהילה — תחום עיסוק, התמחות, קהל יעד, צרכים, הזדמנויות לחיבורים, רעיונות תוכן, פעולות המשך.
10. השב בעברית בלבד.
11. רעיונות תוכן: סווג כל רעיון כ-customer_specific (מותאם למרואיין: פרופיל עסקי, סיפור מקצועי, טיפ מתחום המומחיות שלו) או workies_general (כללי לוורקיז: מגמה בשוק, טיפ לעסקים, נושא לדיון קהילתי העולה מהשיחה). השתדל לייצר לפחות רעיון אחד מכל סוג אם רלוונטי.

הקשר הלקוח:
שם לקוח: ${customerContext.customer_name || "לא ידוע"}
קוד חדר: ${customerContext.room_code || "לא ידוע"}
תוויות קיימות: ${JSON.stringify(customerContext.existing_tags || [])}
תובנות קודמות: ${JSON.stringify(customerContext.previous_insights || [])}

טקסט השיחה / התמלול:
"""
${rawText}
"""

נתח את השיחה והחזר JSON מובנה בלבד לפי הסכמה.`;
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
    const { conversation_id, tenant_id, raw_text, customer_context } = body;

    if (!conversation_id || !raw_text) {
      return Response.json({ error: "Missing conversation_id or raw_text" }, { status: 400 });
    }

    const context = customer_context || {};

    const prompt = buildPrompt(raw_text, context);

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: ANALYSIS_SCHEMA,
    });

    const analysis = llmResponse.data || llmResponse;

    // Update the conversation with AI analysis
    const updateData = {
      ai_analysis_status: "analyzed",
      ai_summary: analysis.summary || "",
      ai_facts: (analysis.facts || []).map(f => f.content),
      ai_business_domain: analysis.business_profile?.business_domain?.value || "",
      ai_expertise: analysis.business_profile?.expertise?.value || "",
      ai_target_customers: analysis.business_profile?.target_customers?.value || "",
      ai_customer_needs: (analysis.needs || []).map(n => n.title),
      ai_opportunities: (analysis.opportunities || []).map(o => o.title),
      ai_content_ideas: (analysis.content_ideas || []).map(c => c.topic),
      ai_connection_ideas: (analysis.connection_ideas || []).map(c => ({
        reason: c.reason,
        what_to_look_for: c.what_to_look_for,
        confidence: c.confidence,
      })),
      ai_follow_up_actions: (analysis.follow_up_actions || []).map(f => f.title),
      ai_suggested_tags: (analysis.suggested_tags || []).map(t => t.tag),
      ai_confidence_notes: (analysis.missing_information || []).join("; "),
    };

    await base44.entities.CustomerConversation.update(conversation_id, updateData);

    const customerName = context.customer_name || "";

    // Create CustomerInsight records for each insight type
    const insightRecords = [];

    // Facts
    for (const f of (analysis.facts || [])) {
      insightRecords.push({
        tenant_id, conversation_id,
        customer_name: customerName,
        room_code: context.room_code || "",
        insight_type: "business_domain",
        title: f.content,
        content: f.content,
        source_quote: f.source_quote || "",
        confidence: f.confidence || "unknown",
        status: "new",
      });
    }

    // Business domain
    if (analysis.business_profile?.business_domain?.value && !analysis.business_profile.business_domain.value.includes("לא זוהה")) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "business_domain",
        title: "תחום עיסוק",
        content: analysis.business_profile.business_domain.value,
        source_quote: analysis.business_profile.business_domain.source_quote || "",
        confidence: analysis.business_profile.business_domain.confidence || "unknown",
        status: "new",
      });
    }

    // Expertise
    if (analysis.business_profile?.expertise?.value && !analysis.business_profile.expertise.value.includes("לא זוהה")) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "expertise",
        title: "התמחות",
        content: analysis.business_profile.expertise.value,
        source_quote: analysis.business_profile.expertise.source_quote || "",
        confidence: analysis.business_profile.expertise.confidence || "unknown",
        status: "new",
      });
    }

    // Target customers
    if (analysis.business_profile?.target_customers?.value && !analysis.business_profile.target_customers.value.includes("לא זוהה")) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "target_customer",
        title: "קהל יעד",
        content: analysis.business_profile.target_customers.value,
        source_quote: analysis.business_profile.target_customers.source_quote || "",
        confidence: analysis.business_profile.target_customers.confidence || "unknown",
        status: "new",
      });
    }

    // Needs
    for (const n of (analysis.needs || [])) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "need",
        title: n.title,
        content: n.content || n.title,
        source_quote: n.source_quote || "",
        confidence: n.confidence || "unknown",
        status: "new",
      });
    }

    // Opportunities
    for (const o of (analysis.opportunities || [])) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "opportunity",
        title: o.title,
        content: o.content || o.title,
        source_quote: o.source_quote || "",
        confidence: o.confidence || "unknown",
        status: "new",
      });
    }

    // Content ideas
    for (const c of (analysis.content_ideas || [])) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "content_idea",
        title: c.topic,
        content: c.topic,
        source_quote: c.source_quote || "",
        confidence: c.confidence || "unknown",
        status: "new",
      });
    }

    // Follow up actions
    for (const f of (analysis.follow_up_actions || [])) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "follow_up",
        title: f.title,
        content: f.title,
        source_quote: f.source_quote || "",
        confidence: f.confidence || "unknown",
        status: "new",
      });
    }

    // Suggested tags
    for (const t of (analysis.suggested_tags || [])) {
      insightRecords.push({
        tenant_id, conversation_id, customer_name: customerName, room_code: context.room_code || "",
        insight_type: "tag",
        title: t.tag,
        content: t.reason || t.tag,
        source_quote: t.source_quote || "",
        confidence: t.confidence || "unknown",
        status: "new",
      });
    }

    // Bulk create insights
    if (insightRecords.length > 0) {
      await base44.entities.CustomerInsight.bulkCreate(insightRecords);
    }

    // Create WeeklyContentIdea records for content ideas
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 0 : day));
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

    const contentIdeaRecords = (analysis.content_ideas || []).map((c, i) => {
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
      return {
        week_start_date: weekStartStr,
        day_of_week: dayNames[i % 5],
        platform: c.platform_suggestion || "facebook",
        topic: c.topic,
        content_type: c.content_type || "customer_specific",
        related_customer_id: tenant_id,
        related_customer_name: customerName,
        source_note: c.source_quote || "",
        status: "idea",
      };
    });

    if (contentIdeaRecords.length > 0) {
      await base44.entities.WeeklyContentIdea.bulkCreate(contentIdeaRecords);
    }

    // Create CommunityConnectionSuggestion records (only for high/medium confidence)
    const connectionRecords = (analysis.connection_ideas || [])
      .filter(c => c.confidence === "high" || c.confidence === "medium")
      .map(c => ({
        customer_a_id: tenant_id,
        customer_a_name: customerName,
        customer_b_name: c.what_to_look_for || "",
        reason: c.reason,
        source_conversation_id: conversation_id,
        source_quote: c.source_quote || "",
        confidence: c.confidence,
        status: "idea",
      }));

    if (connectionRecords.length > 0) {
      await base44.entities.CommunityConnectionSuggestion.bulkCreate(connectionRecords);
    }

    return Response.json({
      ok: true,
      analysis,
      insights_created: insightRecords.length,
      content_ideas_created: contentIdeaRecords.length,
      connections_created: connectionRecords.length,
    });
  } catch (error) {
    console.error("analyzeCustomerConversation error:", error);
    return Response.json({ error: error.message || "שגיאה בניתוח" }, { status: 500 });
  }
}