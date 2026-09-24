import { useNavigate } from "react-router-dom";
import { Gift, ChevronLeft } from "lucide-react";

export default function ReferralQuickCard() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/friend-referral")}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-950 text-white text-right border-2 border-teal-400 hover:bg-zinc-900 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-teal-400 flex items-center justify-center shrink-0">
        <Gift className="w-5 h-5 text-zinc-950" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black leading-tight">חבר <span className="text-teal-400">מביא חבר</span></p>
        <p className="text-[11px] text-zinc-300">שובר 500 ₪ על כל משרד שנשכר בעקבות ההמלצה</p>
      </div>
      <ChevronLeft className="w-5 h-5 text-teal-400 shrink-0" />
    </button>
  );
}