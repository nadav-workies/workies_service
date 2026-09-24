import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, MessageCircle } from "lucide-react";

export default function ReferralShareCard() {
  const url = `${window.location.origin}/referral-share`;
  const [copied, setCopied] = useState(false);
  const waText = encodeURIComponent(`חבר מביא חבר ב-Workies 🎁 שובר 500 ₪ על כל משרד שנשכר בעקבות ההמלצה: ${url}`);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="w-4 h-4 text-primary" />קישור לשיתוף מחוץ לאפליקציה
      </div>
      <p className="text-xs text-muted-foreground">כל מי שיקבל את הקישור יוכל להשאיר המלצה — ההמלצה נרשמת במאגר ונפתחת קריאה.</p>
      <Input value={url} readOnly className="bg-background font-mono text-xs" dir="ltr" />
      <div className="flex gap-2">
        <Button size="sm" onClick={copy} className="gap-1.5 flex-1">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "הועתק" : "העתקת קישור"}
        </Button>
        <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button size="sm" variant="outline" className="gap-1.5 w-full"><MessageCircle className="w-3.5 h-3.5" />וואטסאפ</Button>
        </a>
      </div>
    </div>
  );
}