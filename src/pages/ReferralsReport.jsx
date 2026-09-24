import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Download, FileText } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/permissions";
import { TERMINAL_REFERRAL_STATUSES, normalizePhone } from "@/lib/referralConfig";
import { exportReferralsCsv } from "@/lib/referralService";
import ReferralKpis from "@/components/referral/ReferralKpis";
import ReferralReportCard from "@/components/referral/ReferralReportCard";
import ReferralStatusDialog from "@/components/referral/ReferralStatusDialog";
import ReferralTermsDialog from "@/components/referral/ReferralTermsDialog";
import ReferralShareCard from "@/components/referral/ReferralShareCard";

export default function ReferralsReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { if (!isManagerOrAdmin(u)) navigate("/"); else setUser(u); }).catch(() => navigate("/"));
  }, [navigate]);

  const { data: referrals = [], isLoading, refetch } = useQuery({
    queryKey: ["referrals-report"],
    queryFn: () => base44.entities.Referral.list("-created_date", 1000),
    enabled: !!user,
  });

  // כפילות = אותו טלפון הומלץ קודם (הזכאות לממליץ הראשון — סעיף 8)
  const duplicateIds = useMemo(() => {
    const firstByPhone = new Map();
    [...referrals].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)).forEach(r => {
      const p = r.friend_phone_normalized || normalizePhone(r.friend_phone);
      if (!firstByPhone.has(p)) firstByPhone.set(p, r.id);
    });
    return new Set(referrals.filter(r => firstByPhone.get(r.friend_phone_normalized || normalizePhone(r.friend_phone)) !== r.id).map(r => r.id));
  }, [referrals]);

  const filtered = useMemo(() => {
    let list = referrals;
    if (filter === "open") list = list.filter(r => !TERMINAL_REFERRAL_STATUSES.includes(r.status));
    else if (filter === "closed_no") list = list.filter(r => ["not_relevant", "existing_lead", "duplicate"].includes(r.status));
    else if (filter !== "all") list = list.filter(r => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(r => [r.friend_name, r.friend_phone, r.referrer_name, r.referrer_email, r.referrer_room, r.ticket_number].some(v => (v || "").toLowerCase().includes(q)));
    return list;
  }, [referrals, filter, search]);

  if (!user || isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">דוח חבר מביא חבר</h1>
          <button onClick={() => setTermsOpen(true)} className="text-xs text-primary inline-flex items-center gap-1 underline"><FileText className="w-3.5 h-3.5" />תקנון המבצע</button>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReferralsCsv(filtered)}><Download className="w-4 h-4" />ייצוא לאקסל</Button>
      </div>
      <ReferralShareCard />
      <ReferralKpis referrals={referrals} active={filter} onSelect={(k) => setFilter(filter === k ? "all" : k)} />
      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם, טלפון, ממליץ או מספר קריאה" className="pr-9" />
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} המלצות</p>
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12 border-2 border-dashed rounded-xl">אין המלצות בסינון זה</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {filtered.map(r => <ReferralReportCard key={r.id} referral={r} isDuplicate={duplicateIds.has(r.id)} onEdit={() => setEditing(r)} />)}
        </div>
      )}
      {editing && <ReferralStatusDialog referral={editing} user={user} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}
      <ReferralTermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}