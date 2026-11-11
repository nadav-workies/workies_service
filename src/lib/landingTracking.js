// Call only after the server confirms that the lead was saved.
export function completeLandingLead(campaign) {
  sessionStorage.setItem('workies_lead_campaign', campaign);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'contact_us' });
  window.location.assign('/thank-you');
}