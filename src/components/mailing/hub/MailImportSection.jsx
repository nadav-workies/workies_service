import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload } from "lucide-react";
import { PageHeader, Panel } from "@/components/mailing-mockup/shared";
import ImportPreview from "./ImportPreview";
import ImportHistory from "./ImportHistory";

export default function MailImportSection() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function read(f) {
    if (!f) return;
    setFile(f); setRows(null); setError(""); setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: f });
      const { data } = await base44.functions.invoke("mailContacts", { action: "read_file", file_uri });
      const out = data.rows || [];
      if (!out.length) throw new Error("empty");
      setRows(out);
    } catch { setError("לא הצלחנו לקרוא את הקובץ. ודאו שיש בו עמודת מייל ונסו שוב."); }
    finally { setBusy(false); }
  }
  const reset = () => { setFile(null); setRows(null); qc.invalidateQueries({ queryKey: ["mail"] }); };

  return <div className="space-y-4">
    <PageHeader title="ייבוא אנשי קשר" subtitle="קובץ Excel או CSV עם עמודת מייל. כתובות קיימות מתעדכנות ולא נוצרות כפולות." />
    {!rows && <Panel>
      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer hover:bg-muted/40">
        {busy ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Upload className="w-8 h-8 text-primary" />}
        <span className="font-medium">{busy ? `קורא את ${file?.name}...` : "בחירת קובץ"}</span>
        <span className="text-xs text-muted-foreground">xlsx, xls, csv · עד 2,000 שורות · הקובץ נשמר באופן פרטי</span>
        <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" disabled={busy} onChange={e => read(e.target.files?.[0])} />
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </Panel>}
    {rows && <ImportPreview fileName={file.name} rows={rows} onCancel={() => setRows(null)} onDone={reset} />}
    <ImportHistory />
  </div>;
}