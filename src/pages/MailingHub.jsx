import { NavLink, Navigate, useParams } from "react-router-dom";
import { LayoutDashboard, Users, ListChecks, LayoutTemplate, Send, Workflow, Upload, Settings, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import MailDashboard from "@/components/mailing-mockup/MailDashboard";
import MailContacts from "@/components/mailing-mockup/MailContacts";
import MailLists from "@/components/mailing-mockup/MailLists";
import MailTemplates from "@/components/mailing-mockup/MailTemplates";
import MailCampaigns from "@/components/mailing-mockup/MailCampaigns";
import MailAutomations from "@/components/mailing-mockup/MailAutomations";
import MailImport from "@/components/mailing-mockup/MailImport";
import MailSettings from "@/components/mailing-mockup/MailSettings";

const SECTIONS = [
  { key: "dashboard", label: "דשבורד", icon: LayoutDashboard, el: MailDashboard },
  { key: "contacts", label: "אנשי קשר", icon: Users, el: MailContacts },
  { key: "lists", label: "רשימות וסגמנטים", icon: ListChecks, el: MailLists },
  { key: "templates", label: "טמפלטים", icon: LayoutTemplate, el: MailTemplates },
  { key: "campaigns", label: "קמפיינים", icon: Send, el: MailCampaigns },
  { key: "automations", label: "אוטומציות", icon: Workflow, el: MailAutomations },
  { key: "import", label: "ייבוא", icon: Upload, el: MailImport },
  { key: "settings", label: "הגדרות", icon: Settings, el: MailSettings },
];

export default function MailingHub() {
  const { section = "dashboard" } = useParams();
  const current = SECTIONS.find(s => s.key === section);
  if (!current) return <Navigate to="/mailing/dashboard" replace />;
  const Section = current.el;
  return <div dir="rtl" className="w-full min-w-0 max-w-6xl mx-auto space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold">דיוור</h1>
        <p className="text-muted-foreground text-sm mt-1">מאגר אחד לכל מי שנרשם אלינו, וממנו קמפיינים ואוטומציות.</p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
        <FlaskConical className="w-3.5 h-3.5" />מוקאפ · נתוני דמה · שום מייל לא נשלח
      </span>
    </div>
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1" aria-label="ניווט דיוור">
      {SECTIONS.map(s => <NavLink key={s.key} to={`/mailing/${s.key}`}
        className={({ isActive }) => cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
          isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
        <s.icon className="w-4 h-4" />{s.label}
      </NavLink>)}
    </nav>
    <Section />
  </div>;
}
