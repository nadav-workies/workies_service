import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isManagerOrAdmin } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import DailyOfficeLeadRow from "@/components/landing/DailyOfficeLeadRow";

export default function LeadsReport() {
  const client = useQueryClient();
  const { data: user, isPending: loadingUser } = useQuery({ queryKey: ["landing-manager"], queryFn: () => base44.auth.me() });
  const allowed = isManagerOrAdmin(user);
  const { data, isPending, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["daily-office-leads"], enabled: allowed, initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.DailyOfficeLead.list({ sort: "-created_date", limit: 30, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["daily-office-leads"] });
  useEffect(() => {
    if (!allowed) return;
    return base44.entities.DailyOfficeLead.subscribe(() => client.invalidateQueries({ queryKey: ["daily-office-leads"] }));
  }, [allowed, client]);
  if (loadingUser) return <p role="status" className="py-12 text-center">טוענים…</p>;
  if (!allowed) return <Navigate to="/" replace />;
  const leads = data?.pages.flatMap(page => page.items) || [];
  return <div dir="rtl" className="max-w-3xl mx-auto space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">דוח לידים</h1><p className="text-muted-foreground">פניות להתנסות במשרד יומי</p></div><Button asChild variant="outline" className="h-11"><Link to="/landing-pages">לקישור עמוד הנחיתה</Link></Button></div>
    {isPending ? <p role="status" className="py-12 text-center">טוענים פניות…</p> : error ? <div role="alert" className="border rounded-xl p-5"><p>לא ניתן לטעון את הפניות כרגע.</p><Button variant="outline" onClick={refresh} className="mt-3">ניסיון נוסף</Button></div> : leads.length ? leads.map(lead => <DailyOfficeLeadRow key={lead.id} lead={lead} onSaved={refresh} />) : <div className="text-center border border-dashed rounded-xl p-8 space-y-2"><h2 className="font-bold">עדיין אין פניות</h2><p className="text-muted-foreground">שתפו את קישור ההתנסות, והפניות יופיעו כאן.</p><Link to="/landing-pages" className="text-primary underline inline-flex min-h-11 items-center">לשיתוף העמוד</Link></div>}
    {hasNextPage && <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="h-11 w-full">{isFetchingNextPage ? "טוענים…" : "טעינת פניות נוספות"}</Button>}
  </div>;
}