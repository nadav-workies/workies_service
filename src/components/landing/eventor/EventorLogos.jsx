import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ClientLogoMark from "@/components/landing/eventor/ClientLogoMark";
import Reveal from "@/components/landing/eventor/Reveal";

// One moving row of logo cards; the list is doubled so the loop is seamless.
function LogoRow({ items, reverse }) {
  return <div className={`ev-marquee${reverse ? " ev-marquee-rev" : ""}`}>
    <ul className="ev-marquee-track">
      {items.map(l => <ClientLogoMark key={l.id} src={l.logo_image} alt={l.name} />)}
      {items.map(l => <ClientLogoMark key={`dup-${l.id}`} src={l.logo_image} alt="" dup />)}
    </ul>
  </div>;
}

export default function EventorLogos() {
  const { data: logos = [] } = useQuery({
    queryKey: ["client-logos", "workies-events"],
    queryFn: async () => (await base44.entities.ClientLogo.filter({ is_active: true, show_on: "workies-events" }, { sort: "sort_order", limit: 100 })).items,
  });
  if (!logos.length) return null;
  const half = Math.ceil(logos.length / 2);
  const rows = logos.length >= 12 ? [logos.slice(0, half), logos.slice(half)] : [logos];
  return <section className="ev-clients" aria-labelledby="ev-clients-title">
    <Reveal className="ev-wrap ev-stack-sm">
      <span className="ev-label">לקוחותינו</span>
      <h2 id="ev-clients-title" className="ev-h2">ארגונים וחברות שבחרו ב־Workies</h2>
    </Reveal>
    <div className={logos.length < 6 ? "ev-logo-rows ev-logo-rows-static" : "ev-logo-rows"} aria-label="לוגואים של לקוחות Workies">
      {rows.map((items, i) => <LogoRow key={i} items={items} reverse={i === 1} />)}
    </div>
  </section>;
}