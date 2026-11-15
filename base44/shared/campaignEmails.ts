import { sendLoggedEmail } from './messageLog.ts';

const SITE = 'https://service.workies.co.il';

// Campaign pages that can email their registrants. page_type is the default until an admin changes it.
export const EMAIL_CAMPAIGNS = {
  office: { entity: 'DailyOfficeLead', page_type: 'sponsored', title: 'התנסות במשרד יומי', path: '/daily-office' },
  podcast: { entity: 'PodcastLead', page_type: 'sponsored', title: 'התנסות באולפן הפודקאסט', path: '/podcast' },
  workies_ai: { entity: 'WorkiesAILead', page_type: 'event', title: 'Workies AI | עמוד נחיתה עם Claude', path: '/workies-ai' },
  hr_meetup: { entity: 'HRMeetupLead', page_type: 'event', title: 'HR מחוץ לשגרה', path: '/hr-meetup' },
};

export async function campaignSettings(base44, campaign) {
  const def = EMAIL_CAMPAIGNS[campaign];
  if (!def) return null;
  const { items } = await base44.asServiceRole.entities.CampaignValidity.filter({ campaign }, { sort: '-created_date', limit: 1 });
  const s = items[0] || {};
  return {
    campaign, ...def,
    page_type: s.page_type || def.page_type,
    confirmation: s.confirmation_email_enabled !== false,
    reminders: s.reminders_enabled !== false,
    event_name: s.event_name || def.title,
    event_date: s.event_date || '',
    event_time: s.event_time || '',
    event_location: s.event_location || 'WORKIES, אליהו נאווי 24, באר שבע',
    event_program: s.event_program || '',
    url: SITE + def.path,
  };
}

export function hebrewDate(date) {
  if (!date) return '';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Jerusalem' });
}

export function eventVariables(s, name) {
  return {
    first_name: String(name || '').trim().split(' ')[0] || 'שלום',
    event_name: s.event_name, event_date: hebrewDate(s.event_date) || 'יעודכן בהמשך',
    event_time: s.event_time || 'יעודכן בהמשך', event_location: s.event_location,
    event_program: s.event_program || 'התוכנית המלאה מופיעה בעמוד האירוע.', page_url: s.url, campaign_title: s.title,
  };
}

// Anti-relay limits for the public lead form: one confirmation per address per campaign per 30 days,
// and at most HOURLY_CAP confirmations per campaign per hour.
const HOURLY_CAP = 30;
async function confirmationAllowed(base44, key, email) {
  const log = base44.asServiceRole.entities.NotificationLog;
  const since = (ms) => new Date(Date.now() - ms).toISOString();
  const [mine, recent] = await Promise.all([
    log.filter({ notification_key: key, recipient_email: email, created_date: { $gte: since(30 * 864e5) } }, { limit: 1 }),
    log.filter({ notification_key: key, created_date: { $gte: since(36e5) } }, { limit: HOURLY_CAP }),
  ]);
  return !(mine.items || mine).length && (recent.items || recent).length < HOURLY_CAP;
}

// Registration confirmation (event) or details-received confirmation (sponsored campaign).
export async function sendLeadConfirmation(base44, campaign, { name, email }) {
  const s = await campaignSettings(base44, campaign);
  if (!s || !s.confirmation || !['event', 'sponsored'].includes(s.page_type)) return null;
  const isEvent = s.page_type === 'event';
  const template_name = !isEvent ? 'LeadReceived' : campaign === 'hr_meetup' ? 'HRMeetupConfirmation' : 'EventConfirmation';
  const key = `${isEvent ? 'event_confirmation' : 'lead_received'}_${campaign}`;
  if (!await confirmationAllowed(base44, key, email)) return { success: false, reason: 'rate_limited', message: 'confirmation skipped: send limit reached' };
  return sendLoggedEmail(base44, {
    source: campaign === 'hr_meetup' ? 'hr_meetup' : 'leads',
    key,
    to: email, template_name, category: 'transactional', from_name: 'Workies',
    variables: eventVariables(s, name),
  });
}