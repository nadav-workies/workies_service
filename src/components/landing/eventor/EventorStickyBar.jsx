import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { trackEventor } from "@/lib/eventorTracking";
import { scrollToLeadForm } from "@/lib/eventorLeadScroll";

// Floating mobile action bar: slides in after the hero, steps aside while the form is on screen.
export default function EventorStickyBar({ tel, wa }) {
  const [seen, setSeen] = useState({ hero: true, form: false });
  useEffect(() => {
    const hero = document.querySelector(".ev-hero");
    const form = document.getElementById("lead-form");
    const io = new IntersectionObserver(entries => entries.forEach(e =>
      setSeen(s => ({ ...s, [e.target === hero ? "hero" : "form"]: e.isIntersecting }))));
    [hero, form].forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const hidden = seen.hero || seen.form;
  return <nav aria-label="פעולות מהירות" className="ev-sticky" data-hidden={hidden} inert={hidden ? "" : undefined}>
    <a href={tel} onClick={() => trackEventor("phone_click", "sticky_bar")} className="ev-sticky-icon" aria-label="התקשרו"><Phone className="w-5 h-5" aria-hidden="true" /></a>
    <a href={wa} target="_blank" rel="noopener" onClick={() => trackEventor("whatsapp_click", "sticky_bar")} className="ev-sticky-icon" aria-label="וואטסאפ"><MessageCircle className="w-5 h-5" aria-hidden="true" /></a>
    <a href="#lead-form" onClick={scrollToLeadForm} className="ev-sticky-lead">השאירו פרטים</a>
  </nav>;
}