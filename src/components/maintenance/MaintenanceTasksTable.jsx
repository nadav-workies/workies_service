import { Pencil, Trash2, CheckCircle2, XCircle, ClipboardCheck, AlertTriangle } from "lucide-react";
import { getCategory, getStatus, getPriority, getApprovalStatus, DEFAULT_WORKER, formatHebrewDate } from "@/lib/maintenanceConfig";
import { isScheduleAllowed } from "@/lib/maintenanceWindows";

export default function MaintenanceTasksTable({ tasks, windows = [], onEdit, onDelete, onStatus, admin }) {
  return (
    <div className="border rounded-xl bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="text-right font-medium px-3 py-2">משימה</th>
            <th className="text-right font-medium px-3 py-2">תאריך / שעה</th>
            <th className="text-right font-medium px-3 py-2">אחראי</th>
            <th className="text-right font-medium px-3 py-2">קטגוריה</th>
            <th className="text-right font-medium px-3 py-2">דחיפות</th>
            <th className="text-right font-medium px-3 py-2">סטטוס</th>
            <th className="text-right font-medium px-3 py-2">אישור</th>
            <th className="text-right font-medium px-3 py-2">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const cat = getCategory(t.category), st = getStatus(t.status), pr = getPriority(t.priority);
            const ap = getApprovalStatus(t.approval_status || "pending_approval");
            const pending = ap.key === "pending_approval";
            const worker = t.assigned_maintenance_worker || DEFAULT_WORKER;
            const inWindow = isScheduleAllowed(windows, t.planned_date, t.start_time, worker);
            return (
              <tr key={t.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">
                  <p className="font-medium">{t.title}</p>
                  {t.location && <p className="text-xs text-muted-foreground">📍 {t.location}</p>}
                  {!inWindow && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> מחוץ לחלון שיבוץ זמין
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatHebrewDate(t.planned_date)} · {t.start_time || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{worker}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${cat.color}`}>{cat.label}</span></td>
                <td className="px-3 py-2"><span className={`text-xs font-medium ${pr.color}`}>{pr.label}</span></td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${st.color}`}>{st.label}</span></td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${ap.color}`}>{ap.label}</span></td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {!pending && t.status !== "done" && (
                      <button onClick={() => onStatus(t, "done")} title="בוצע" className="text-green-700 hover:bg-green-50 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></button>
                    )}
                    {!pending && t.status !== "not_done" && (
                      <button onClick={() => onStatus(t, "not_done")} title="לא בוצע" className="text-red-700 hover:bg-red-50 p-1.5 rounded-md"><XCircle className="w-4 h-4" /></button>
                    )}
                    {!pending && t.status !== "checked" && (
                      <button onClick={() => onStatus(t, "checked")} title="נבדק" className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-md"><ClipboardCheck className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => onEdit(t)} title="ערוך" className="text-muted-foreground hover:bg-muted p-1.5 rounded-md"><Pencil className="w-4 h-4" /></button>
                    {admin && <button onClick={() => onDelete(t.id)} title="מחק" className="text-muted-foreground hover:text-red-600 p-1.5 rounded-md"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}