import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, MessageCircle } from "lucide-react";
import campaigns from "@/components/landing/campaigns";

export default function LandingShareCard({ campaign = "office" }) {
  const [message, setMessage] = useState("");
  const config = campaigns[campaign];
  const url = `${window.location.origin}${config.path}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage("הקישור הועתק"); }
    catch { setMessage("אפשר לסמן ולהעתיק את הקישור מהשדה."); }
  }
  return <div className="rounded-xl border bg-card p-5 space-y-4">
    <div><h2 className="text-xl font-bold">{config.title}</h2><p className="text-muted-foreground mt-1">{config.description}</p></div>
    <Input aria-label={`קישור ציבורי: ${config.title}`} value={url} readOnly dir="ltr" className="h-11" onFocus={e => e.target.select()} />
    <div className="flex flex-wrap gap-2">
      <Button onClick={copy} className="min-h-11"><Copy />העתקת קישור</Button>
      <Button asChild variant="outline" className="min-h-11"><a href={config.path} target="_blank" rel="noopener noreferrer"><ExternalLink />פתיחת העמוד</a></Button>
      <Button asChild variant="outline" className="min-h-11"><a href={`https://wa.me/?text=${encodeURIComponent(`${config.title} בוורקיז באר שבע: ${url}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle />שיתוף בוואטסאפ</a></Button>
      <Button asChild variant="outline" className="min-h-11"><Link to={`/landing-pages?campaign=${campaign}#registrations`}>לרשימת הפניות</Link></Button>
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </div>;
}