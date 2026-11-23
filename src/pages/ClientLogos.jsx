import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LogoRow from "@/components/landing/logos/LogoRow";
import LogoFormDialog from "@/components/landing/logos/LogoFormDialog";

export default function ClientLogos() {
  const client = useQueryClient();
  const [dialog, setDialog] = useState(null); // null | "new" | logo
  const { data: user, isPending: userPending } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  const key = ["client-logos-admin"];
  const { data: logos = [], isPending } = useQuery({ queryKey: key, enabled: user?.role === "admin", queryFn: async () => (await base44.entities.ClientLogo.list({ sort: "sort_order", limit: 200 })).items });
  const refresh = () => { client.invalidateQueries({ queryKey: key }); client.invalidateQueries({ queryKey: ["client-logos"] }); };
  if (userPending) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const onDragEnd = async ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    const next = [...logos];
    next.splice(destination.index, 0, next.splice(source.index, 1)[0]);
    client.setQueryData(key, next);
    await base44.entities.ClientLogo.bulkUpdate(next.map((l, i) => ({ id: l.id, sort_order: i + 1 })));
    refresh();
  };
  const update = async (id, data) => { await base44.entities.ClientLogo.update(id, data); refresh(); };
  const remove = async id => { await base44.entities.ClientLogo.delete(id); refresh(); };

  return <div dir="rtl" className="w-full max-w-3xl mx-auto space-y-4">
    <Link to="/landing-pages" className="inline-flex items-center gap-1 min-h-10 text-sm text-primary"><ArrowRight className="w-4 h-4" />כל עמודי הנחיתה</Link>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">לוגואים של לקוחות</h1><p className="text-muted-foreground mt-1">מוצגים באזור "לקוחותינו" בעמוד מתחם האירועים. גררו לשינוי הסדר.</p></div>
      <Button onClick={() => setDialog("new")} className="min-h-11"><Plus />הוספת לוגו</Button>
    </div>
    {isPending ? <p role="status" className="py-8 text-center">טוענים לוגואים…</p> : !logos.length ? <p className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">עדיין אין לוגואים.</p> :
      <DragDropContext onDragEnd={onDragEnd}><Droppable droppableId="logos">{p => <div ref={p.innerRef} {...p.droppableProps} className="rounded-xl border divide-y overflow-hidden">
        {logos.map((l, i) => <Draggable key={l.id} draggableId={l.id} index={i}>{d => <div ref={d.innerRef} {...d.draggableProps}>
          <LogoRow logo={l} dragHandleProps={d.dragHandleProps} onToggle={v => update(l.id, { is_active: v })} onEdit={() => setDialog(l)} onDelete={() => remove(l.id)} />
        </div>}</Draggable>)}
        {p.placeholder}
      </div>}</Droppable></DragDropContext>}
    {dialog && <LogoFormDialog open onOpenChange={o => !o && setDialog(null)} logo={dialog === "new" ? null : dialog} nextOrder={logos.length + 1} onSaved={refresh} />}
  </div>;
}