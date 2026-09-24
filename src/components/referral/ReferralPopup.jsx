import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { isCampaignActive } from "@/lib/referralConfig";
import ReferralTermsDialog from "@/components/referral/ReferralTermsDialog";

const SEEN_KEY = "referral_popup_seen";

export default function ReferralPopup() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => isCampaignActive() && !sessionStorage.getItem(SEEN_KEY));
  const [termsOpen, setTermsOpen] = useState(false);

  const close = () => { sessionStorage.setItem(SEEN_KEY, "1"); setOpen(false); };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent dir="rtl" className="max-w-sm bg-zinc-950 text-white border-zinc-800 text-center">
          <Gift className="w-10 h-10 text-teal-400 mx-auto" />
          <DialogTitle className="text-3xl font-black leading-tight">
            חבר <span className="text-teal-400">מביא חבר</span>
          </DialogTitle>
          <p className="text-sm text-zinc-300">ממליצים. נהנים יחד.</p>
          <div className="py-2">
            <p className="text-sm text-zinc-300">שובר קנייה בשווי</p>
            <p className="text-5xl font-black">500 ₪</p>
            <p className="inline-block mt-1 px-3 py-0.5 rounded bg-teal-400 text-zinc-950 font-bold">מתנה!</p>
          </div>
          <p className="text-xs text-zinc-400">עבור כל משרד שנשכר בעקבות ההמלצה שלך. בתוקף עד 15.10.2026.</p>
          <button
            onClick={() => { close(); navigate("/friend-referral"); }}
            className="w-full h-11 rounded-full bg-teal-400 text-zinc-950 font-bold hover:bg-teal-300 transition-colors"
          >
            להמליץ על חבר עכשיו
          </button>
          <div className="flex items-center justify-center gap-4 text-xs">
            <button onClick={() => setTermsOpen(true)} className="text-teal-300 underline">לתקנון המבצע</button>
            <button onClick={close} className="text-zinc-400 hover:text-white">אולי אחר כך</button>
          </div>
        </DialogContent>
      </Dialog>
      <ReferralTermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </>
  );
}