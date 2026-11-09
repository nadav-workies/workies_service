export function dateIsActive(endDate, now = new Date()) {
  return !endDate || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jerusalem' }).format(now) <= endDate;
}
export async function campaignIsActive(base44, campaign) {
  const { items } = await base44.asServiceRole.entities.CampaignValidity.filter({ campaign }, { sort: '-created_date', limit: 1 });
  if (items[0] && items[0].is_enabled === false) return false;
  const endDate = items[0] ? items[0].end_date : ({ referral: '2026-10-15', hr_meetup: '2026-11-23' }[campaign] || '');
  return dateIsActive(endDate);
}