import { useState } from "react";
import { Gift, FileText } from "lucide-react";
import PublicReferralForm from "@/components/referral/PublicReferralForm";
import ReferralTermsDialog from "@/components/referral/ReferralTermsDialog";
import { isCampaignActive } from "@/lib/referralConfig";

export default function PublicReferralPage() {
  const [termsOpen, setTermsOpen] = useState(false);
  const active = isCampaignActive();

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8" dir="rtl">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-black tracking-tight">Workies</p>
          <Gift className="w-10 h-10 text-teal-400 mx-auto" />
          <h1 className="text-4xl font-black leading-tight">חבר <span className="text-teal-400">מביא חבר</span></h1>
          <p className="text-sm text-zinc-300">ממליצים. נהנים יחד.</p>
          <p className="text-sm text-zinc-300">שובר קנייה בשווי <b className="text-white text-lg">500 ₪</b> על כל משרד שנשכר בעקבות ההמלצה</p>
          <button onClick={() => setTermsOpen(true)} className="inline-flex items-center gap-1 text-xs text-teal-300 underline">
            <FileText className="w-3.5 h-3.5" />לתקנון המבצע
          </button>
        </div>
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
          {active ? <PublicReferralForm onOpenTerms={() => setTermsOpen(true)} />
            : <p className="text-center text-sm text-zinc-300 py-6">המבצע הסתיים ב-15.10.2026. תודה לכל הממליצים!</p>}
        </div>
      </div>
      <ReferralTermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}