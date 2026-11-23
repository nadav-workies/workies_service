import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ClientLogoMark from "@/components/landing/eventor/ClientLogoMark";

export default function EventorLogos() {
  const { data: logos = [] } = useQuery({
    queryKey: ["client-logos", "workies-events"],
    queryFn: async () => (await base44.entities.ClientLogo.filter({ is_active: true, show_on: "workies-events" }, { sort: "sort_order", limit: 100 })).items,
  });
  if (!logos.length) return null;
  return <section className="ev-clients" aria-labelledby="ev-clients-title">
    <div className="ev-wrap ev-stack-sm">
      <span className="ev-label">לקוחותינו</span>
      <h2 id="ev-clients-title" className="ev-h2">ארגונים וחברות שבחרו ב־Workies</h2>
      <ul className="ev-logos" aria-label="לוגואים של לקוחות Workies">
        {logos.map(l => <ClientLogoMark key={l.id} src={l.logo_image} alt={l.name} />)}
      </ul>
    </div>
  </section>;
}