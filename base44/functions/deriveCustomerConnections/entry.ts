import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SCHEMA = {
  type: "object",
  properties: {
    connections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          customer_a_id: { type: "string" },
          customer_b_id: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] }
        },
        required: ["customer_a_id", "customer_b_id", "reason"]
      }
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

    const body = await req.json().catch(() => ({}));
    const { customer_id } = body;

    // Read all customers + their insights
    const tenants = await base44.entities.RoomTenant.list("-created_date", 500);
    const insights = await base44.entities.CustomerInsight.list("-created_date", 1000);

    // Build profiles from card data + insights
    const profiles = tenants.map(t => {
      const tInsights = insights.filter(i => i.tenant_id === t.id);
      return {
        id: t.id,
        name: t.customer_name,
        industry: t.industry || "",
        business_domain: tInsights.find(i => i.insight_type === "business_domain")?.content || "",
        expertise: tInsights.find(i => i.insight_type === "expertise")?.content || "",
        target_customers: tInsights.find(i => i.insight_type === "target_customer")?.content || "",
        needs: tInsights.filter(i => i.insight_type === "need").map(i => i.title),
      };
    }).filter(p => p.business_domain || p.expertise || p.target_customers || p.needs.length > 0 || p.industry);

    if (profiles.length === 0) {
      return Response.json({ ok: true, connections_created: 0, message: "אין נתוני לקוחות לחיבור" });
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const prompt = `אתה מנתח חיבורים עסקיים במתחם עבודה משותף (קואורקינג).
בהתבסס אך ורק על כרטיסי הלקוחות (תחום עיסוק, התמחות, קהל יעד, צרכים), מצא חיבורים פוטנציאליים עסקיים בין לקוחות.

כללים:
1. חבר רק לקוחות שיש להם פוטנציאל עסקי אמיתי לשיתוף פעולה או הפניית לקוחות.
2. קהל יעד של אחד תואם לתחום עיסוק/התמחות של השני = high.
3. צורך של אחד שיכול להיענות על ידי מומחיות של השני = medium.
4. תחום דומה או משלים = low.
5. הסבר את הסיבה בקצרה ובעברית.
6. אל תחזיר חיבורים חלשים או מופשטים. איכות על כמות.
7. השתמש רק ב-id של לקוחות שקיימים ברשימה.

פרופילי לקוחות:
${JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name, industry: p.industry, business_domain: p.business_domain, expertise: p.expertise, target_customers: p.target_customers, needs: p.needs })))}

${customer_id ? `גזור חיבורים עבור הלקוח עם id "${customer_id}" בלבד (כלקוח א').` : "גזור חיבורים לכל הלקוחות."}

החזר JSON בלבד.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });

    const result = llmResponse.data || llmResponse;
    const rawConnections = (result.connections || []).filter(c =>
      c.customer_a_id && c.customer_b_id &&
      c.customer_a_id !== c.customer_b_id &&
      profileMap.has(c.customer_a_id) && profileMap.has(c.customer_b_id)
    );

    // Delete old auto-derived connections for the target customer
    if (customer_id) {
      try {
        await base44.entities.CommunityConnectionSuggestion.deleteMany({ customer_a_id: customer_id });
      } catch (e) { /* ignore if none exist */ }
    }

    const connectionRecords = rawConnections.map(c => ({
      customer_a_id: c.customer_a_id,
      customer_a_name: profileMap.get(c.customer_a_id)?.name || "",
      customer_b_id: c.customer_b_id,
      customer_b_name: profileMap.get(c.customer_b_id)?.name || "",
      reason: c.reason,
      source_quote: "",
      confidence: c.confidence || "medium",
      status: "idea",
    }));

    if (connectionRecords.length > 0) {
      await base44.entities.CommunityConnectionSuggestion.bulkCreate(connectionRecords);
    }

    return Response.json({
      ok: true,
      connections_created: connectionRecords.length,
      connections: connectionRecords,
    });
  } catch (error) {
    console.error("deriveCustomerConnections error:", error);
    return Response.json({ error: error.message || "שגיאה" }, { status: 500 });
  }
}