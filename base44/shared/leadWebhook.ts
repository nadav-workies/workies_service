const WEBHOOK_URL = 'https://hook.eu1.make.com/6tmsgu4sp7op7zspz7d7aarc71egqh0x';

// Sends a saved lead to the Make webhook unless it was switched off for this campaign.
export async function sendLeadWebhook(base44, campaign, data, rawSid) {
  const { items } = await base44.asServiceRole.entities.CampaignValidity.filter({ campaign }, { sort: '-created_date', limit: 1 });
  if (items[0]?.webhook_enabled === false) return;
  const clean = String(rawSid || '').trim().slice(0, 40);
  const sid = /^[0-9a-f]+$/i.test(clean) ? clean : (Date.now().toString(16) + Math.random().toString(16).slice(2, 14)).slice(0, 24);
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign, ...data, sid, submitted_at: new Date().toISOString() }),
  }).catch((e) => ({ ok: false, status: e.message }));
  if (!res.ok) console.error('lead webhook failed', campaign, res.status);
}