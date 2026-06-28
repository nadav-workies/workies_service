import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

const EXPECTED_COLUMNS = [
  { key: "full_name", label: "שם מלא", required: true },
  { key: "email", label: "מייל", required: true },
  { key: "phone", label: "טלפון" },
  { key: "room_number", label: "מספר חדר" },
  { key: "room_label", label: "שם חדר" },
  { key: "room_area", label: "אזור" },
  { key: "role", label: "תפקיד (admin/manager/user)" },
];

export default function ImportUsersDialog({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // Step 1: Upload the file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: Call the import backend function
      setUploading(false);
      setImporting(true);
      const res = await base44.functions.invoke("importUsersFromExcel", { file_url });
      const data = res.data || res;

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        onImported?.();
      }
    } catch (err) {
      setError(err.message || "שגיאה בייבוא");
    } finally {
      setUploading(false);
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (uploading || importing) return;
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            ייבוא משתמשים מאקסל
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">הייבוא הושלם</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">סה״כ שורות</p>
                <p className="text-lg font-bold">{result.total}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">משתמשים קיימים עודכנו</p>
                <p className="text-lg font-bold text-blue-600">{result.updatedUsers}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">מיובאים קיימים עודכנו</p>
                <p className="text-lg font-bold text-amber-600">{result.updatedImported}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">חדשים במערכת</p>
                <p className="text-lg font-bold text-emerald-600">{result.newImported}</p>
              </div>
            </div>
            {result.skipped > 0 && (
              <p className="text-xs text-muted-foreground">דולגו {result.skipped} שורות ללא מייל</p>
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
              המשתמשים החדשים מופיעים בטבלת "חדשים במערכת" וניתן לשלוח להם הזמנה למייל.
            </p>
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
                  <p className="text-sm text-muted-foreground">לחץ לבחירת קובץ Excel</p>
                  <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    בחר קובץ
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium">עמודות נדרשות בקובץ:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXPECTED_COLUMNS.map(col => (
                  <span
                    key={col.key}
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${col.required ? "border-primary text-primary font-medium" : "border-border text-muted-foreground"}`}
                  >
                    {col.label}{col.required && " *"}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                * מייל חובה. משתמשים קיימים לא ידרסו — רק שדות חסרים יתמלאו.
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
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={uploading || importing}>ביטול</Button>
              <Button onClick={handleImport} disabled={!file || uploading || importing} className="gap-2">
                {(uploading || importing) && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "מעלה קובץ..." : importing ? "מייבא..." : "ייבא משתמשים"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}