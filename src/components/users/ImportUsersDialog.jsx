import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Info } from "lucide-react";

const COLUMN_TAGS = [
  "אימייל *",
  "שם מלא",
  "טלפון",
  "תפקיד",
  "חדר",
  "קוד משרד",
  "סטטוס",
];

const ACTION_STYLES = {
  "יעודכן": "bg-blue-50 text-blue-700 border-blue-200",
  "לא נמצא": "bg-amber-50 text-amber-700 border-amber-200",
  "חסר אימייל": "bg-red-50 text-red-700 border-red-200",
  "אין שינוי": "bg-muted text-muted-foreground border-border",
  "שגיאת הרשאה — Manager לא יכול לעדכן תפקיד": "bg-red-50 text-red-700 border-red-200",
  "לא ניתן להסיר הרשאת Admin מהאדמין היחיד": "bg-red-50 text-red-700 border-red-200",
};

export default function ImportUsersDialog({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setError(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      setUploading(false);
      setAnalyzing(true);
      const res = await base44.functions.invoke("importUsersFromExcel", {
        file_url,
        dry_run: true,
        file_name: file.name,
      });
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
      } else {
        setPreview(data);
      }
    } catch (err) {
      setError(err.message || "שגיאה בניתוח הקובץ");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!fileUrl) return;
    setApplying(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("importUsersFromExcel", {
        file_url: fileUrl,
        dry_run: false,
        file_name: file.name,
      });
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        onImported?.();
      }
    } catch (err) {
      setError(err.message || "שגיאה בעדכון המשתמשים");
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    if (uploading || analyzing || applying) return;
    onClose();
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setFileUrl(null);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            עדכון פרטי משתמשים מאקסל
          </DialogTitle>
        </DialogHeader>

        {/* Result view */}
        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">העדכון הושלם</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">סה״כ שורות</p>
                <p className="text-lg font-bold">{result.total}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">עודכנו</p>
                <p className="text-lg font-bold text-blue-600">{result.updated}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">לא נמצאו</p>
                <p className="text-lg font-bold text-amber-600">{result.not_found}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">דולגו</p>
                <p className="text-lg font-bold">{result.skipped}</p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
                <p className="font-medium mb-1">שגיאות ({result.errors.length}):</p>
                <ul className="list-disc pr-4 space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : preview ? (
          /* Preview view */
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">סה״כ שורות</p>
                <p className="text-lg font-bold">{preview.total}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">משתמשים לעדכון</p>
                <p className="text-lg font-bold text-blue-600">{preview.will_update}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">לא נמצאו</p>
                <p className="text-lg font-bold text-amber-600">{preview.not_found}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">דולגו / שגיאות</p>
                <p className="text-lg font-bold">{preview.skipped + preview.perm_errors}</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px] border rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="sticky top-0 bg-muted/50 z-10">
                  <tr className="border-b">
                    <th className="p-2 font-semibold">אימייל</th>
                    <th className="p-2 font-semibold">שם קיים</th>
                    <th className="p-2 font-semibold">שם חדש</th>
                    <th className="p-2 font-semibold">טלפון קיים</th>
                    <th className="p-2 font-semibold">טלפון חדש</th>
                    <th className="p-2 font-semibold">תפקיד קיים</th>
                    <th className="p-2 font-semibold">תפקיד חדש</th>
                    <th className="p-2 font-semibold">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/20">
                      <td className="p-2" dir="ltr">{row.email || "—"}</td>
                      <td className="p-2 text-muted-foreground">{row.existing_name || "—"}</td>
                      <td className="p-2 font-medium">{row.new_name || "—"}</td>
                      <td className="p-2 text-muted-foreground" dir="ltr">{row.existing_phone || "—"}</td>
                      <td className="p-2 font-medium" dir="ltr">{row.new_phone || "—"}</td>
                      <td className="p-2 text-muted-foreground">{row.existing_role || "—"}</td>
                      <td className="p-2 font-medium">{row.new_role || "—"}</td>
                      <td className="p-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ACTION_STYLES[row.action] || "bg-muted text-muted-foreground border-border"}`}>
                          {row.action}
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
          /* Upload view */
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

            <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                המערכת תזהה משתמשים קיימים לפי אימייל ותעדכן רק שדות שיש להם ערך בקובץ. משתמשים שלא קיימים לא ייווצרו אוטומטית.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium">עמודות נתמכות:</p>
              <div className="flex flex-wrap gap-1.5">
                {COLUMN_TAGS.map((col, i) => (
                  <span
                    key={i}
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${col.includes("*") ? "border-primary text-primary font-medium" : "border-border text-muted-foreground"}`}
                  >
                    {col}
                  </span>
                ))}
              </div>
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
              <Button variant="outline" onClick={reset} disabled={applying}>בחר קובץ אחר</Button>
              <Button onClick={handleApply} disabled={applying || preview.will_update === 0} className="gap-2">
                {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                אשר ועדכן משתמשים ({preview.will_update})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={uploading || analyzing}>ביטול</Button>
              <Button onClick={handleAnalyze} disabled={!file || uploading || analyzing} className="gap-2">
                {(uploading || analyzing) && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "מעלה קובץ..." : analyzing ? "מנתח..." : "צור תצוגה מקדימה"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}