// Sends an email through Core.SendEmail and records it in NotificationLog.
// Keeps the caller's behavior: returns SendEmail's result and rethrows on failure.
// Every email carries an invisible open-tracking pixel tied to its log record.
const PIXEL_BASE = 'https://workies-service.base44.app/functions/emailOpen';

function preview(html) {
  return String(html || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
}

async function log(base44, data) {
  await base44.asServiceRole.entities.NotificationLog.create({ ticket_id: '', ticket_number: '', sent_at: new Date().toISOString(), ...data })
    .catch((e) => console.error('message log failed', e.message));
}

function withPixel(email, url) {
  if (email.template_name) return { ...email, variables: { ...(email.variables || {}), open_pixel_url: url } };
  const img = `<img src="${url}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px" />`;
  if (email.html) return { ...email, html: email.html + img };
  if (email.body) return { ...email, body: email.body + img };
  return email;
}

export async function sendLoggedEmail(base44, { source, key, recipientType = 'user', ...email }) {
  const tracking_id = crypto.randomUUID();
  const base = {
    source, notification_key: key, recipient_email: email.to, recipient_type: recipientType,
    subject: email.subject || email.template_name || '', template_name: email.template_name || '',
    body_preview: preview(email.body || email.html), variables: email.variables || undefined, tracking_id,
  };
  try {
    const res = await base44.asServiceRole.integrations.Core.SendEmail(withPixel(email, `${PIXEL_BASE}?t=${tracking_id}`));
    const failed = res?.success === false;
    await log(base44, { ...base, status: failed ? 'failed' : 'sent', ...(failed ? { error_message: res.reason || res.message || '' } : {}) });
    return res;
  } catch (err) {
    await log(base44, { ...base, status: 'failed', error_message: err.message });
    throw err;
  }
}