import campaigns from '@/components/landing/campaigns';

// Call only after the server confirms that the lead was saved.
export function completeLandingLead(campaign) {
  sessionStorage.setItem('workies_lead_campaign', campaign);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'contact_us', campaign });
  window.location.assign(campaigns[campaign]?.thankYou || '/thank-you');
}