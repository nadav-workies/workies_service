import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, LayoutDashboard } from "lucide-react";
import { isManagerOrAdmin } from "@/lib/permissions";

export default function Home() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const isMgr = isManagerOrAdmin(user);
  const location = isMgr
    ? "הקריאה תיפתח בשם Workies — קבלה"
    : user?.default_room_number ? `משרד ${user.default_room_number} יזוהה אוטומטית` : "";

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center gap-6 px-4" dir="rtl">
      <div className="space-y-1">
        <h1 className="text-2xl font-black">שלום{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}</h1>
        <p className="text-muted-foreground text-sm">משהו צריך טיפול? פתחו קריאה בלחיצה אחת</p>
      </div>
      <Link to="/tickets/new" className="relative group" aria-label="פתיחת קריאה חדשה">
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <span className="relative w-40 h-40 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center ring-8 ring-primary/15 group-hover:scale-105 group-active:scale-95 transition-transform">
          <Plus className="w-20 h-20" strokeWidth={2.5} />
        </span>
      </Link>
      <div className="space-y-1">
        <p className="text-lg font-bold">פתיחת קריאה מהירה</p>
        {location && <p className="text-xs text-primary font-medium">{location}</p>}
      </div>
      {isMgr && (
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground underline">
          <LayoutDashboard className="w-4 h-4" />לדשבורד התפעול
        </Link>
      )}
    </div>
  );
}