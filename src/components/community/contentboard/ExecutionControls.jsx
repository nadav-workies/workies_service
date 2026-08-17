import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ExecutionControls({ item, onChanged }) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(item.execution_note || "");
  const [busy, setBusy] = useState(false);

  const markDone = async () => {
    setBusy(true);
    await base44.entities.WeeklyContentIdea.update(item.id, { execution_status: "done", execution_note: "" });
    setBusy(false);
    setShowNote(false);
    onChanged({ ...item, execution_status: "done", execution_note: "" });
  };

  const saveNotDone = async () => {
    setBusy(true);
    await base44.entities.WeeklyContentIdea.update(item.id, { execution_status: "not_done", execution_note: note });
    setBusy(false);
    setShowNote(false);
    onChanged({ ...item, execution_status: "not_done", execution_note: note });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-bold">בקרת ביצוע:</span>
        <Button size="sm" variant={item.execution_status === "done" ? "default" : "outline"}
          className="h-7 text-xs gap-1" disabled={busy} onClick={markDone}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} סמן בוצע
        </Button>
        <Button size="sm" variant={item.execution_status === "not_done" ? "destructive" : "outline"}
          className="h-7 text-xs gap-1" disabled={busy} onClick={() => setShowNote(true)}>
          <XCircle className="w-3.5 h-3.5" /> סמן לא בוצע
        </Button>
      </div>
      {item.execution_status === "not_done" && item.execution_note && !showNote && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">סיבת אי ביצוע: {item.execution_note}</p>
      )}
      {showNote && (
        <div className="space-y-1.5">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="סיבת אי ביצוע" className="text-sm" />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" disabled={busy} onClick={saveNotDone}>
              {busy && <Loader2 className="w-3 h-3 animate-spin" />} שמור
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNote(false)}>ביטול</Button>
          </div>
        </div>
      )}
    </div>
  );
}