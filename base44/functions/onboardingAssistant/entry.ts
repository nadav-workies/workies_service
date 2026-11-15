import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Answers a question about one onboarding track. Track and stages load with the caller's own permissions.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim().slice(0, 2000);
    if (!body.onboarding_id || !question) return Response.json({ error: 'onboarding_id and question are required' }, { status: 400 });

    const track = await base44.entities.EmployeeOnboarding.get(String(body.onboarding_id)).catch((e) => ([403, 404].includes(e.status) ? null : Promise.reject(e)));
    if (!track) return Response.json({ error: 'Not found' }, { status: 404 });
    const stages = await base44.entities.OnboardingStage.filter({ onboarding_id: track.id }, { sort: 'order_number', limit: 200 });
    const list = stages.items || stages;
    const isManager = user.role === 'admin' || user.role === 'manager';

    const stagesSummary = list
      .map((s) => `- יום ${s.day_number}: ${s.title} (סטטוס: ${s.status}${s.quiz_score != null ? `, ציון: ${s.quiz_score}` : ''})`)
      .join('\n');
    const prompt = `אתה עוזר וירטואלי לתהליך חפיפה בחברת Workies.
פרטי החפיפה: שם: ${track.employee_name}, תפקיד: ${track.role_title}, התקדמות: ${track.progress_percent}%, סטטוס: ${track.status}, שלבים שהושלמו: ${track.completed_stages}/${track.total_stages}, תאריך תחילה: ${track.start_date}, תאריך סיום מתוכנן: ${track.planned_end_date}.

שלבי החפיפה:
${stagesSummary}

השאלה נשאלה על ידי ${isManager ? 'מנהל' : 'המשתמש/ת'}: ${question}

ענה בעברית, בקצרה ובצורה ברורה ומועילה. אם השאלה לא קשורה לחפיפה, בקש להבהיר.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    return Response.json({ answer: typeof res === 'string' ? res : JSON.stringify(res) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}