import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldCheck, Clock4 } from "lucide-react";
import AvailabilityReport, { checkWorker } from "@/components/maintenance/AvailabilityReport";
import { DEFAULT_WORKER } from "@/lib/maintenanceConfig";

export default function SubmittedReport({ task, setTask, onClose, onAssign, canApprove, approverName, windows, workers, workerRecords }) {
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const worker = task.assigned_maintenance_worker || DEFAULT_WORKER;
  const list = workers.length ? workers : [worker];
  const ok = checkWorker(windows, workerRecords, worker, task.planned_date, task.start_time).ok;

  const pick = (updates) => setTask(t => ({ ...t, ...updates }));
  const approve = async () => {
    setBusy(true);
    await onAssign(task.id, {
      assigned_maintenance_worker: worker, planned_date: task.planned_date, start_time: task.start_time,
      approval_status: "approved", approved_by: approverName, approved_at: new Date().toISOString(),
    });
    setBusy(false);
    setApproved(true);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1.5 pt-2">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
        <p className="text-lg font-bold">{approved ? "המשימה שובצה ואושרה" : "הבקשה שלך נקלטה"}</p>
        <p className="text-sm text-muted-foreground">{task.title}</p>
        {!approved && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
            <Clock4 className="w-3.5 h-3.5" />בודקים זמינות עובדים — ממתין לאישור ושיבוץ מנהל התפעול
          </p>
        )}
      </div>

      <AvailabilityReport windows={windows} workerRecords={workerRecords} workers={canApprove ? list : [worker]}
        worker={worker} date={task.planned_date} time={task.start_time} selectable={canApprove && !approved} onPick={pick} />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>סגירה</Button>
        {canApprove && !approved && (
          <Button onClick={approve} disabled={busy || !ok} className="gap-1 bg-amber-600 hover:bg-amber-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}שבץ ואשר
          </Button>
        )}
      </div>
    </div>
  );
}