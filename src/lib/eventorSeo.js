import { EV_IMAGES, FAQ, SEO } from "@/lib/eventorContent";

const URL = "https://service.workies.co.il/workies-events";

// Head tags for search engines and social previews. Nothing here is visible on the page.
export function eventorHeadTags(settings) {
  const meta = [
    ["name", "description", SEO.description],
    ["name", "keywords", SEO.keywords],
    ["name", "robots", "index, follow, max-image-preview:large"],
    ["property", "og:title", SEO.title],
    ["property", "og:description", SEO.description],
    ["property", "og:image", EV_IMAGES.hall],
    ["property", "og:image:alt", "אולם האיוונטור במתחם האירועים של Workies באר שבע"],
    ["property", "og:type", "website"],
    ["property", "og:url", URL],
    ["property", "og:locale", "he_IL"],
    ["property", "og:site_name", "Workies"],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", SEO.title],
    ["name", "twitter:description", SEO.description],
    ["name", "twitter:image", EV_IMAGES.hall],
  ];
  const venue = {
    "@context": "https://schema.org", "@type": "EventVenue", name: "Eventor by Workies, מתחם האירועים באר שבע",
    description: SEO.description, url: URL, image: [EV_IMAGES.hall, EV_IMAGES.art, EV_IMAGES.classroom, EV_IMAGES.meeting],
    telephone: settings.phone, maximumAttendeeCapacity: settings.capacity_eventor, priceRange: "₪₪",
    address: { "@type": "PostalAddress", streetAddress: "דרך אליהו נאוי 24", addressLocality: "באר שבע", addressCountry: "IL" },
    amenityFeature: ["מולטימדיה והקלטת וידאו", "מערכת סאונד", "Wi-Fi", "חניה חינם", "נגישות", "הסעדה כשרה"].map(name => ({ "@type": "LocationFeatureSpecification", name, value: true })),
  };
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  const els = meta.map(([attr, key, content]) => {
    const el = document.createElement("meta");
    el.setAttribute(attr, key); el.setAttribute("content", content);
    return el;
  });
  const canonical = document.createElement("link");
  canonical.rel = "canonical"; canonical.href = URL;
  els.push(canonical);
  [venue, faq].forEach(data => {
    const s = document.createElement("script");
    s.type = "application/ld+json"; s.textContent = JSON.stringify(data);
    els.push(s);
  });
  els.forEach(el => document.head.appendChild(el));
  return () => els.forEach(el => el.remove());
}