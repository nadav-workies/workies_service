const WEBHOOK_URL = 'https://hook.eu1.make.com/6tmsgu4sp7op7zspz7d7aarc71egqh0x';

const FORMS = {
  office: { form_id: 'daily_office_form', form_name: 'התנסות במשרד יומי' },
  podcast: { form_id: 'podcast_form', form_name: 'התנסות באולפן הפודקאסט' },
  workies_ai: { form_id: 'workies_ai_form', form_name: 'Workies AI | עמוד נחיתה עם Claude' },
  hr_meetup: { form_id: 'hr_meetup_form', form_name: 'HR מחוץ לשגרה | מיטאפ' },
  referral: { form_id: 'referral_form', form_name: 'חבר מביא חבר' },
};

// Sends a saved lead to the Make webhook unless it was switched off for this campaign.
export async function sendLeadWebhook(base44, campaign, data, rawSid) {
  const { items } = await base44.asServiceRole.entities.CampaignValidity.filter({ campaign }, { sort: '-created_date', limit: 1 });
  if (items[0]?.webhook_enabled === false) return;
  const clean = String(rawSid || '').trim().slice(0, 40);
  const sid = /^[0-9a-f]+$/i.test(clean) ? clean : (Date.now().toString(16) + Math.random().toString(16).slice(2, 14)).slice(0, 24);
  const { form_id, form_name } = FORMS[campaign] || { form_id: campaign, form_name: campaign };
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ source: 'base44', form_id, form_name, campaign, ...data, sid, submitted_at: new Date().toISOString() }),
  }).catch((e) => ({ ok: false, status: e.message }));
  if (!res.ok) console.error('lead webhook failed', campaign, res.status);
}