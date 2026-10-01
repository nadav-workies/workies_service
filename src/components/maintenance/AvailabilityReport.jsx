import { CheckCircle2, XCircle } from "lucide-react";
import { workerWindowsForDate, findMatchingWindow, workerShiftForDate, isWithinShift, upcomingWindowDates } from "@/lib/maintenanceWindows";
import { formatHebrewDate } from "@/lib/maintenanceConfig";

export function checkWorker(windows, workerRecords, worker, date, time) {
  const shift = workerShiftForDate(workerRecords.find(w => w.name === worker), date);
  const shiftOk = isWithinShift(shift, time);
  const win = findMatchingWindow(windows, date, time, worker);
  const reason = !shift ? "לא עובד ביום זה" : !shiftOk ? `מחוץ לשעות העבודה (${shift.start_time}–${shift.end_time})` : !win ? "אין חלון שיבוץ פנוי בשעה זו" : "";
  return { ok: !!win && shiftOk, reason, dayWindows: workerWindowsForDate(windows, date, worker) };
}

// דוח זמינות — מוצג אחרי הגשת הבקשה. selectable = מנהל מאשר יכול לבחור עובד/מועד
export default function AvailabilityReport({ windows, workerRecords, workers, worker, date, time, selectable, onPick }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">דוח זמינות · {formatHebrewDate(date)} {time}</p>
      {workers.map(w => {
        const r = checkWorker(windows, workerRecords, w, date, time);
        const next = r.ok ? [] : upcomingWindowDates(windows, w, today, 3).filter(d => d !== date);
        const chosen = w === worker;
        return (
          <div key={w} className={`rounded-lg border p-2.5 text-xs space-y-1.5 ${r.ok ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"} ${chosen ? "ring-2 ring-primary/40" : ""}`}>
            <div className="flex items-center gap-1.5">
              {r.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
              <span className="font-semibold text-sm">{w}</span>
              <span className={r.ok ? "text-green-700" : "text-red-700"}>{r.ok ? "זמין" : `לא זמין — ${r.reason}`}</span>
              {selectable && r.ok && !chosen && (
                <button type="button" onClick={() => onPick({ assigned_maintenance_worker: w })} className="mr-auto px-2 py-1 rounded border bg-card">בחירה</button>
              )}
              {chosen && <span className="mr-auto text-primary font-medium">משובץ</span>}
            </div>
            {selectable && r.dayWindows.length > 0 && !r.ok && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground">חלונות היום:</span>
                {r.dayWindows.map(win => (
                  <button key={win.id} type="button" onClick={() => onPick({ assigned_maintenance_worker: w, start_time: win.start_time })} className="px-2 py-0.5 rounded border bg-card">{win.start_time}–{win.end_time}</button>
                ))}
              </div>
            )}
            {selectable && next.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground">מועדים פנויים:</span>
                {next.map(d => (
                  <button key={d} type="button" onClick={() => onPick({ assigned_maintenance_worker: w, planned_date: d, start_time: workerWindowsForDate(windows, d, w)[0]?.start_time || time })} className="px-2 py-0.5 rounded border bg-card">{formatHebrewDate(d)}</button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}