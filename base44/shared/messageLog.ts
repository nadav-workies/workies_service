// Sends an email through Core.SendEmail and records it in NotificationLog.
// Keeps the caller's behavior: returns SendEmail's result and rethrows on failure.
function preview(html) {
  return String(html || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
}

async function log(base44, data) {
  await base44.asServiceRole.entities.NotificationLog.create({ ticket_id: '', ticket_number: '', sent_at: new Date().toISOString(), ...data })
    .catch((e) => console.error('message log failed', e.message));
}

export async function sendLoggedEmail(base44, { source, key, recipientType = 'user', ...email }) {
  const base = {
    source, notification_key: key, recipient_email: email.to, recipient_type: recipientType,
    subject: email.subject || email.template_name || '', template_name: email.template_name || '',
    body_preview: preview(email.body || email.html), variables: email.variables || undefined,
  };
  try {
    const res = await base44.asServiceRole.integrations.Core.SendEmail(email);
    const failed = res?.success === false;
    await log(base44, { ...base, status: failed ? 'failed' : 'sent', ...(failed ? { error_message: res.reason || res.message || '' } : {}) });
    return res;
  } catch (err) {
    await log(base44, { ...base, status: 'failed', error_message: err.message });
    throw err;
  }
}