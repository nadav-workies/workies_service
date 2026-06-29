import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Mail } from "lucide-react";

const MATCH_STATUS_STYLES = {
  "נמצא חדר תואם": "bg-emerald-100 text-emerald-700",
  "לא נמצא חדר תואם": "bg-orange-100 text-orange-700",
  "חסר קוד משרד": "bg-red-100 text-red-700",
  "חסר שם לקוח": "bg-red-100 text-red-700",
  "חסר אימייל": "bg-red-100 text-red-700",
  "קוד משרד כפול באותו אימייל": "bg-red-100 text-red-700",
  "לא נטען — סטטוס לא פעיל": "bg-gray-100 text-gray-600",
};

export default function ImportTenantsDialog({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setPreviewing(true);
      const res = await base44.functions.invoke("importActiveCustomers", { file_url, dry_run: true });
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
      } else {
        setPreview(data);
      }
    } catch (err) {
      setError(err.message || "שגיאה בקריאת הקובץ");
    } finally {
      setUploading(false);
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setSaving(true);
      const res = await base44.functions.invoke("importActiveCustomers", { file_url, dry_run: false });
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        onImported?.();
      }
    } catch (err) {
      setError(err.message || "שגיאה בשמירה");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (uploading || previewing || saving) return;
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            ייבוא דיירים פעילים מאקסל
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">השמירה הושלמה</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">סה״כ שורות</p>
                <p className="text-lg font-bold">{result.total}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">נוספו</p>
                <p className="text-lg font-bold text-emerald-600">{result.created}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">עודכנו</p>
                <p className="text-lg font-bold text-blue-600">{result.updated}</p>
              </div>
            </div>
            {result.skipped > 0 && (
              <p className="text-xs text-muted-foreground">דולגו {result.skipped} שורות (לא פעילות / שגיאות / חסרות שדות חובה)</p>
            )}
            {result.errors?.length > 0 && (
              <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
                <p className="font-medium mb-1">שגיאות ({result.errors.length}):</p>
                <ul className="list-disc pr-4 space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              הדיירים נשמרו ומופיעים בטבלת הדיירים. ניתן לשלוח הזמנה למערכת ידנית לכל דייר.
            </p>
          </div>
        ) : preview ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground">סה״כ: <b>{preview.total}</b></span>
                <span className="text-emerald-600">ישמרו: <b>{preview.will_save}</b></span>
                <span className="text-muted-foreground">דולגו: <b>{preview.skipped}</b></span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="sticky top-0 bg-muted/60">
                  <tr className="border-b">
                    <th className="p-1.5 font-semibold">קוד משרד</th>
                    <th className="p-1.5 font-semibold">חדר מקור</th>
                    <th className="p-1.5 font-semibold">שם לקוח</th>
                    <th className="p-1.5 font-semibold">ח.פ / מזהה</th>
                    <th className="p-1.5 font-semibold">אימייל</th>
                    <th className="p-1.5 font-semibold">טלפון</th>
                    <th className="p-1.5 font-semibold">עמדות</th>
                    <th className="p-1.5 font-semibold">סטטוס לקוח</th>
                    <th className="p-1.5 font-semibold">סטטוס התאמה</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((r, i) => (
                    <tr key={i} className={`border-b ${r.will_save ? "" : "opacity-60"}`}>
                      <td className="p-1.5 font-medium" dir="ltr">{r.room_code || "—"}</td>
                      <td className="p-1.5 text-muted-foreground">{r.room_source_label || "—"}</td>
                      <td className="p-1.5">{r.customer_name || "—"}</td>
                      <td className="p-1.5" dir="ltr">{r.company_id || "—"}</td>
                      <td className="p-1.5" dir="ltr">{r.email || "—"}</td>
                      <td className="p-1.5" dir="ltr">{r.phone || "—"}</td>
                      <td className="p-1.5 text-center">{r.desk_count ?? "—"}</td>
                      <td className="p-1.5">{r.customer_status || "—"}</td>
                      <td className="p-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MATCH_STATUS_STYLES[r.match_status] || "bg-gray-100 text-gray-600"}`}>
                          {r.match_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="w-10 h-10 text-primary mx-auto" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    החלף קובץ
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">לחץ לבחירת קובץ Excel / CSV</p>
                  <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    בחר קובץ
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium">עמודות בקובץ:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Name", "company", "email", "phone-number", "Offices", "Number of desks", "Security", "payment_method", "address", "Date Joined", "Industry", "Status", "Auto Charge Day", "קוד"].map(col => (
                  <span key={col} className={`text-[11px] px-2 py-0.5 rounded-full border ${col === "קוד" ? "border-primary text-primary font-medium" : "border-border text-muted-foreground"}`}>
                    {col}{col === "קוד" && " (מפתח)"}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                השיוך לחדר מתבצע לפי עמודת <b>קוד</b> בלבד. רק לקוחות עם Status=active ייטענו.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {result ? (
            <Button onClick={handleClose}>סגור</Button>
          ) : preview ? (
            <>
              <Button variant="outline" onClick={() => { setPreview(null); setError(null); }} disabled={saving}>
                חזור
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {saving ? "שומר..." : `אישור ושמירה (${preview.will_save})`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={uploading || previewing}>ביטול</Button>
              <Button onClick={handlePreview} disabled={!file || uploading || previewing} className="gap-2">
                {(uploading || previewing) && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "מעלה..." : previewing ? "מנתח..." : "הצג תצוגה מקדימה"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}