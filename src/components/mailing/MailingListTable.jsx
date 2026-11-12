import { useState } from "react";
import { Button } from "@/components/ui/button";

const PER_PAGE = 25;

export default function MailingListTable({ list, isLoading }) {
  const [shown, setShown] = useState(PER_PAGE);
  if (isLoading) return <div className="dt1-skel" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="dt1-skel-row" />)}</div>;
  if (!list.length) return <div className="dt1-empty"><span className="dt1-empty-t">אין נרשמים ברשימה הזו</span><p className="dt1-empty-p">כל מי שנרשם בעמוד נחיתה מהסוג שנבחר יופיע כאן.</p></div>;
  return <div className="dt1-tablewrap">
    <ul className="divide-y">
      {list.slice(0, shown).map(r => <li key={r.email} className="p-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{r.name || "—"}</p>
          <a href={`mailto:${r.email}`} className="text-sm text-primary break-all" dir="ltr">{r.email}</a>
        </div>
        <div className="text-xs text-muted-foreground sm:text-left">
          <p>{r.pages.join(" · ")}</p>
          <p>הרשמה אחרונה: {new Date(r.last).toLocaleDateString("he-IL")}</p>
        </div>
      </li>)}
    </ul>
    {shown < list.length && <div className="p-3 text-center"><Button variant="outline" onClick={() => setShown(s => s + PER_PAGE)}>הצגת עוד ({list.length - shown})</Button></div>}
  </div>;
}