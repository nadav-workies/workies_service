import { Link } from "react-router-dom";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Stat } from "@/components/mailing-mockup/shared";
import { useContactStats, useEmailStats } from "./useMailStats";
import SourcesPanel from "./SourcesPanel";
import AttentionPanel from "./AttentionPanel";
import EmailAreasPanel from "./EmailAreasPanel";
import RecentOpensPanel from "./RecentOpensPanel";

const n = v => (v || 0).toLocaleString("he-IL");

export default function MailDashboardSection() {
  const contacts = useContactStats(), emails = useEmailStats();
  if (contacts.isLoading || emails.isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (contacts.error || emails.error) return <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">טעינת הנתונים נכשלה. נסו לרענן את העמוד.</p>;
  const c = contacts.data, e = emails.data;
  const rate = e.tracked ? Math.round((e.opened / e.tracked) * 100) : null;
  const today = new Date().toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" });

  return <div className="space-y-4">
    <PageHeader title="תמונת מצב" subtitle={`נתוני אמת מבסיס הנתונים · נכון ל-${today}`}
      actions={<Button asChild variant="outline"><Link to="/mailing/contacts"><Users className="w-4 h-4 ml-1" />אנשי קשר</Link></Button>} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Link to="/mailing/contacts" className="transition-transform hover:-translate-y-0.5"><Stat label="אנשי קשר במאגר" value={n(c.total)} hint={`${n(c.lists)} רשימות תפוצה`} /></Link>
      <Link to="/mailing/contacts" className="transition-transform hover:-translate-y-0.5"><Stat label="מאושרים לדיוור" value={n(c.by.subscribed)} hint={`${n(c.by.pending)} ממתינים להסכמה`} tone="orange" /></Link>
      <Link to="/messages" className="transition-transform hover:-translate-y-0.5"><Stat label="מיילים שנשלחו (30 יום)" value={n(e.sent)} hint={`${n(e.failed)} נכשלו`} /></Link>
      <Link to="/mailing/templates" className="transition-transform hover:-translate-y-0.5"><Stat label="אחוז פתיחה (30 יום)" value={rate == null ? "—" : `${rate}%`} hint={`${n(e.opened)} מתוך ${n(e.tracked)} מיילים עם מעקב פתיחה`} tone="orange" /></Link>
    </div>
    <div className="grid lg:grid-cols-3 gap-4">
      <SourcesPanel sources={c.sources} className="lg:col-span-2" />
      <AttentionPanel contacts={c} emails={e} />
    </div>
    <div className="grid lg:grid-cols-2 gap-4">
      <EmailAreasPanel areas={e.areas} />
      <RecentOpensPanel logs={e.recent} />
    </div>
  </div>;
}