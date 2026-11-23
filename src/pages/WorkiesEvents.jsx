import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import "@/components/landing/eventor/EventorPage.css";
import useCampaignValidity from "@/hooks/useCampaignValidity";
import useEventorSettings from "@/hooks/useEventorSettings";
import { EV_IMAGES, SEO } from "@/lib/eventorContent";
import { captureUtm, trackEventor } from "@/lib/eventorTracking";
import EventorHero from "@/components/landing/eventor/EventorHero";
import EventorHall from "@/components/landing/eventor/EventorHall";
import EventorGallery from "@/components/landing/eventor/EventorGallery";
import EventorSpaces from "@/components/landing/eventor/EventorSpaces";
import EventorStory from "@/components/landing/eventor/EventorStory";
import EventorClosing from "@/components/landing/eventor/EventorClosing";

function setMeta(attr, key, content) {
  const el = document.createElement("meta");
  el.setAttribute(attr, key);
  el.setAttribute("content", content);
  document.head.appendChild(el);
  return el;
}

export default function WorkiesEvents() {
  const { active, isPending } = useCampaignValidity("eventor");
  const settings = useEventorSettings();
  const { data: user, isPending: userPending } = useQuery({ queryKey: ["eventor-viewer"], queryFn: () => base44.auth.me().catch(() => null) });
  const viewed = useRef(false);

  useEffect(() => {
    document.title = SEO.title;
    captureUtm();
    const tags = [
      setMeta("name", "description", SEO.description),
      setMeta("property", "og:title", SEO.title),
      setMeta("property", "og:description", SEO.description),
      setMeta("property", "og:image", EV_IMAGES.hall),
      setMeta("property", "og:type", "website"),
    ];
    return () => tags.forEach(t => t.remove());
  }, []);

  // One view per page load, only while the page is published.
  useEffect(() => {
    if (active && !viewed.current) { viewed.current = true; trackEventor("view"); }
  }, [active]);

  if (isPending || settings.isPending || userPending) return <div className="ev-page" style={{ display: "grid", placeItems: "center" }} role="status" aria-label="טוענים" />;
  const isAdmin = user?.role === "admin";
  if (!active && !isAdmin) return <main dir="rtl" lang="he" className="ev-page" style={{ display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
    <div className="ev-stack"><h1 className="ev-h2">העמוד יעלה בקרוב</h1><p className="ev-text">לפרטים על מתחם האירועים אפשר להתקשר: <a href="tel:+972553070051" dir="ltr" style={{ color: "#F3C829", whiteSpace: "nowrap" }}>055-3070051</a></p></div>
  </main>;

  const s = settings.data;
  return <div dir="rtl" lang="he" className="ev-page">
    {!active && <p className="ev-admin-bar">טיוטה: העמוד מוסתר מהציבור. רק אדמין רואה אותו, וצפיות וקליקים לא נספרים.</p>}
    <EventorHero settings={s} />
    <main>
      <EventorHall capacity={s.capacity_eventor} />
      <EventorGallery />
      <EventorSpaces settings={s} />
      <EventorStory />
      <EventorClosing settings={s} />
    </main>
  </div>;
}