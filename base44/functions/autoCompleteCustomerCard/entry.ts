import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SCHEMA = {
  type: "object",
  properties: {
    industry: { type: "string" },
    contact_role: { type: "string" },
    target_customers: { type: "string" },
    expertise: { type: "string" },
    suggested_tags: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
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
    if (!customer_id) return Response.json({ error: "Missing customer_id" }, { status: 400 });

    const tenant = await base44.entities.RoomTenant.get(customer_id);
    const insights = await base44.entities.CustomerInsight.filter({ tenant_id: customer_id }, "-created_date", 50);

    const businessDomain = insights.find(i => i.insight_type === "business_domain")?.content || "";
    const expertise = insights.find(i => i.insight_type === "expertise")?.content || "";
    const targetCustomers = insights.find(i => i.insight_type === "target_customer")?.content || "";
    const needs = insights.filter(i => i.insight_type === "need").map(i => i.title).join("; ");
    const tags = insights.filter(i => i.insight_type === "tag").map(i => i.title);
    const facts = insights.filter(i => i.insight_type === "business_domain" && i.title !== "תחום עיסוק").map(i => i.title).join("; ");

    const prompt = `אתה עוזר להשלים כרטיס לקוח במתחם עבודה משותף.
בהתבסס על התובנות שנאספו משיחות עם הלקוח, הצע ערכים לשדות החסרים בכרטיס.

נתוני הכרטיס הנוכחיים:
שם לקוח: ${tenant.customer_name}
תעשייה: ${tenant.industry || "חסר"}
איש קשר: ${tenant.contact_name || "חסר"}
תפקיד איש קשר: ${tenant.contact_role || "חסר"}

תובנות משיחות (נאספו על ידי AI):
תחום עיסוק: ${businessDomain}
התמחות: ${expertise}
קהל יעד: ${targetCustomers}
צרכים: ${needs}
עובדות נוספות: ${facts}
תוויות קיימות: ${tags.join(", ")}

כללים:
1. הצע ערכים רק על בסיס התובנות — אל תמציא מידע.
2. אם אין מידע לשדה, החזר מחרוזת ריקה.
3. suggested_tags: 3-5 תוויות רלוונטיות קצרות.
4. summary: פסקה קצרה המסכמת את הלקוח לפי התובנות.
5. החזר בעברית.

החזר JSON בלבד.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });

    const suggestions = llmResponse.data || llmResponse;

    return Response.json({
      ok: true,
      suggestions,
      current: {
        industry: tenant.industry || "",
        contact_role: tenant.contact_role || "",
      },
    });
  } catch (error) {
    console.error("autoCompleteCustomerCard error:", error);
    return Response.json({ error: error.message || "שגיאה" }, { status: 500 });
  }
}