import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { canManageLeads } from "@/lib/permissions";
import { loadMailingList, SEGMENTS } from "@/lib/mailingList";
import "@/components/messages/messagesTable.css";
import MailingListToolbar from "@/components/mailing/MailingListToolbar";
import MailingListTable from "@/components/mailing/MailingListTable";


export default function MailingLists() {
  const [type, setType] = useState("event");
  const [search, setSearch] = useState("");
  const { data: user, isPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["mailing-list", type], queryFn: () => loadMailingList(type), enabled: canManageLeads(user) });
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter(r => [r.email, r.name, r.phone].some(v => String(v || "").toLowerCase().includes(q))) : rows;
  }, [rows, search]);
  if (isPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!canManageLeads(user)) return <Navigate to="/" replace />;
  const label = SEGMENTS.find(s => s[0] === type)[1];
  return <div dir="rtl" className="w-full min-w-0 max-w-5xl mx-auto space-y-4">
    <div>
      <Link to="/landing-pages" className="inline-flex items-center gap-1 min-h-10 text-sm text-primary"><ArrowRight className="w-4 h-4" />עמודי נחיתה</Link>
      <h1 className="text-2xl font-bold">רשימות תפוצה</h1>
      <p className="text-muted-foreground mt-1">נרשמים לפי סוג עמוד, כתובת אחת לכל אדם. נרשמים שסומנו לא רלוונטיים לא נכללים.</p>
    </div>
    <section className="dt1-section"><div className="dt1-card">
      <MailingListToolbar type={type} onType={setType} search={search} onSearch={setSearch} list={list} label={label} />
      <MailingListTable list={list} isLoading={isLoading} />
    </div></section>
  </div>;
}