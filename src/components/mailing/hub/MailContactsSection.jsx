import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Loader2 } from "lucide-react";
import { contactQuery } from "@/lib/mailing";
import { PageHeader } from "@/components/mailing-mockup/shared";
import ContactFilters from "./ContactFilters";
import ContactsTable from "./ContactsTable";
import ContactSheet from "./ContactSheet";
import ContactsBulkBar from "./ContactsBulkBar";
import SyncContactsButton from "./SyncContactsButton";

export default function MailContactsSection() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ q: "", consent: "all", source: "all" });
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => { const t = setTimeout(() => setTerm(filters.q), 300); return () => clearTimeout(t); }, [filters.q]);
  const query = contactQuery({ ...filters, q: term });

  const contacts = useInfiniteQuery({
    queryKey: ["mail", "contacts", query],
    queryFn: ({ pageParam }) => base44.entities.MailContact.filter(query, { sort: "-updated_date", limit: 50, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: p => (p.has_more ? p.next_cursor : undefined),
    initialPageParam: null,
  });
  const total = useQuery({ queryKey: ["mail", "contactsCount", query], queryFn: () => base44.entities.MailContact.count(query) });
  const rows = contacts.data?.pages.flatMap(p => p.items) || [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["mail"] });

  return <div className="space-y-4">
    <PageHeader title="אנשי קשר" subtitle={`רשומה אחת לכל כתובת מייל, מכל המקורות.${total.data != null ? ` ${total.data.toLocaleString("he-IL")} אנשי קשר תואמים.` : ""}`}
      actions={<>
        <SyncContactsButton onDone={refresh} />
        <Button variant="outline" asChild><Link to="/mailing/import"><Upload className="w-4 h-4 ml-1" />ייבוא</Link></Button>
        <Button onClick={() => setOpen({})}><Plus className="w-4 h-4 ml-1" />איש קשר</Button>
      </>} />
    <ContactFilters filters={filters} onChange={f => { setFilters(f); setSelected([]); }} />
    {selected.length > 0 && <ContactsBulkBar selected={rows.filter(r => selected.includes(r.id))} onClear={() => setSelected([])} onDone={refresh} />}
    {contacts.isLoading
      ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      : <ContactsTable rows={rows} selected={selected} setSelected={setSelected} onOpen={setOpen} />}
    {contacts.hasNextPage && <div className="flex justify-center">
      <Button variant="outline" disabled={contacts.isFetchingNextPage} onClick={() => contacts.fetchNextPage()}>
        {contacts.isFetchingNextPage && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}טעינת עוד
      </Button>
    </div>}
    <ContactSheet contact={open} onClose={() => setOpen(null)} onSaved={refresh} />
  </div>;
}