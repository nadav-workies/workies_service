import { escapeHtml } from './security.ts';
import { sendLoggedEmail } from './messageLog.ts';

// Recipients for every new lead: Haim Langer (operations) and Sally (sales)
const LEAD_RECIPIENTS = ['maintenance@workies.co.il', 'sp2577@gmail.com'];

export async function notifyNewLead(base44, campaignTitle, fields) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#6a7181">${escapeHtml(k)}</td><td style="padding:6px 12px;font-weight:600">${escapeHtml(v)}</td></tr>`)
    .join('');
  const [setting] = await base44.asServiceRole.entities.NotificationSetting.filter({ key: 'new_lead' }).catch(() => []);
  if (setting && setting.enabled === false) return;
  const name = fields['שם'] || fields['שם החבר/ה'] || '';
  const fill = (t) => t.replace(/\{\{campaign\}\}/g, campaignTitle).replace(/\{\{name\}\}/g, name);
  const intro = fill(setting?.body_template || 'נכנס ליד חדש מעמוד הנחיתה. מומלץ לחזור אליו בהקדם.');
  const subject = fill(setting?.subject_template || 'ליד חדש: {{campaign}} | {{name}}');
  const body = `<div dir="rtl" style="font-family:Heebo,Arial,sans-serif;color:#14181f">
    <h2 style="color:#f97015;margin:0 0 8px">ליד חדש: ${escapeHtml(campaignTitle)}</h2>
    <p style="margin:0 0 12px;color:#6a7181;white-space:pre-wrap">${escapeHtml(intro)}</p>
    <table style="border-collapse:collapse;background:#f7f7f7;border-radius:10px">${rows}</table>
    <p style="margin-top:16px"><a href="https://service.workies.co.il/landing-pages" style="color:#f97015">לצפייה בכל הלידים במערכת</a></p>
  </div>`;
  await Promise.all(LEAD_RECIPIENTS.map((to) =>
    sendLoggedEmail(base44, {
      source: 'leads', key: 'new_lead', recipientType: 'managers',
      to,
      subject,
      body,
      from_name: 'Workies לידים',
      category: 'transactional',
    }).catch((e) => console.error('lead email failed', to, e.message))
  ));
}