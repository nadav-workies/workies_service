import { NavLink, Navigate, useParams } from "react-router-dom";
import { LayoutDashboard, Users, ListChecks, LayoutTemplate, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import MailDashboard from "@/components/mailing/hub/MailDashboardSection";
import MailContacts from "@/components/mailing/hub/MailContactsSection";
import MailLists from "@/components/mailing/hub/MailListsSection";
import MailTemplates from "@/components/mailing/hub/MailTemplatesSection";
import MailImport from "@/components/mailing/hub/MailImportSection";
import MailSettings from "@/components/mailing/hub/MailSettingsSection";

const SECTIONS = [
  { key: "dashboard", label: "דשבורד", icon: LayoutDashboard, el: MailDashboard },
  { key: "contacts", label: "אנשי קשר", icon: Users, el: MailContacts },
  { key: "lists", label: "רשימות וסגמנטים", icon: ListChecks, el: MailLists },
  { key: "templates", label: "טמפלטים", icon: LayoutTemplate, el: MailTemplates },
  { key: "import", label: "ייבוא", icon: Upload, el: MailImport },
  { key: "settings", label: "הגדרות", icon: Settings, el: MailSettings },
];

export default function MailingHub() {
  const { section = "dashboard" } = useParams();
  const current = SECTIONS.find(s => s.key === section);
  if (!current) return <Navigate to="/mailing/dashboard" replace />;
  const Section = current.el;
  return <div dir="rtl" className="w-full min-w-0 max-w-6xl mx-auto space-y-4">
    <div>
      <h1 className="text-2xl font-bold">דיוור</h1>
      <p className="text-muted-foreground text-sm mt-1">מאגר אחד לכל מי שנרשם אלינו. כל המספרים כאן נשלפים מבסיס הנתונים.</p>
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