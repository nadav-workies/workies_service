import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/mailing-mockup/shared";
import ListCard from "./ListCard";
import ListFormDialog from "./ListFormDialog";

export default function MailListsSection() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const lists = useQuery({
    queryKey: ["mail", "lists"],
    queryFn: async () => (await base44.entities.MailList.list({ sort: "-created_date", limit: 200 })).items,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["mail"] });

  return <div className="space-y-4">
    <PageHeader title="רשימות וסגמנטים" subtitle="רשימה סטטית נבנית ידנית או מייבוא. סגמנט דינמי מתעדכן לבד לפי תנאים."
      actions={<Button onClick={() => setEditing({})}><Plus className="w-4 h-4 ml-1" />רשימה חדשה</Button>} />
    {lists.isLoading
      ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      : lists.data.length === 0
        ? <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">עדיין אין רשימות. צרו רשימה ראשונה או סגמנט לפי מקור ההרשמה.</p>
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{lists.data.map(l => <ListCard key={l.id} list={l} onEdit={() => setEditing(l)} onDeleted={refresh} />)}</div>}
    <ListFormDialog list={editing} onClose={() => setEditing(null)} onSaved={refresh} />
  </div>;
}