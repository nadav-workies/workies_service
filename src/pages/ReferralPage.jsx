import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gift, FileText } from "lucide-react";
import ReferralForm from "@/components/referral/ReferralForm";
import MyReferralsList from "@/components/referral/MyReferralsList";
import ReferralTermsDialog from "@/components/referral/ReferralTermsDialog";
import ReferralShareCard from "@/components/referral/ReferralShareCard";

export default function ReferralPage() {
  const [user, setUser] = useState(null);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: referrals = [], refetch } = useQuery({
    queryKey: ["my-referrals", user?.id],
    queryFn: () => base44.entities.Referral.filter({ created_by_id: user.id }, "-created_date", 50),
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-xl mx-auto space-y-4" dir="rtl">
      <div className="rounded-2xl bg-zinc-950 text-white p-5 text-center space-y-1">
        <Gift className="w-8 h-8 text-teal-400 mx-auto" />
        <h1 className="text-2xl font-black">חבר <span className="text-teal-400">מביא חבר</span></h1>
        <p className="text-sm text-zinc-300">שובר קנייה בשווי <b className="text-white">500 ₪</b> על כל משרד שנשכר בעקבות ההמלצה שלך</p>
        <button onClick={() => setTermsOpen(true)} className="inline-flex items-center gap-1 text-xs text-teal-300 underline pt-1">
          <FileText className="w-3.5 h-3.5" />לתקנון המבצע
        </button>
      </div>
      <ReferralForm user={user} onSubmitted={refetch} onOpenTerms={() => setTermsOpen(true)} />
      <ReferralShareCard />
      <MyReferralsList referrals={referrals} />
      <ReferralTermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}