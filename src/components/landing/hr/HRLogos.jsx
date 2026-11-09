import { PARTNER_LOGOS } from "@/components/landing/hr/hrContent";

export default function HRLogos() {
  return <section className="hr-logos" aria-labelledby="hr-logos-title">
    <div className="hr-wrap">
      <h2 id="hr-logos-title" className="hr-logos-title">בשיתוף</h2>
      <ul className="hr-logos-row">
        {PARTNER_LOGOS.map(l => <li key={l.name}><img src={l.src} alt={l.name} loading="lazy" /></li>)}
      </ul>
    </div>
  </section>;
}