import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Filter, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import AttachmentUploader from "@/components/tickets/AttachmentUploader";
import { getTodayRange, getCurrentCalendarMonthRange, getPreviousCalendarMonthRange, getCustomDateRange } from "@/lib/dateRangeUtils";

const AREAS = ["שירותים", "מטבחון", "מסדרון", "לאונג׳", "Open Space", "חדר ישיבות", "חלל ציבורי", "אחר"];

function RatingButton({ value, selected, onClick }) {
  const color = value >= 9 ? "bg-emerald-500 text-white border-emerald-500"
    : value >= 6 ? "bg-amber-500 text-white border-amber-500"
    : "bg-red-500 text-white border-red-500";
  return (
    <button type="button" onClick={() => onClick(value)}
      className={`w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all ${selected === value ? color : "border-border hover:border-primary"}`}>
      {value}
    </button>
  );
}

function MetricCard({ label, value, color = "text-foreground", sub }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${color}`}>{value ?? "אין נתונים"}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function CleaningReport() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterArea, setFilterArea] = useState("all");
  const [filterLow, setFilterLow] = useState(false);
  const [rangeMode, setRangeMode] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [form, setForm] = useState({
    area: "",
    specific_location: "",
    cleanliness_rating: null,
    notes: "",
    photo_attachments: [],
    inspection_date: format(new Date(), "yyyy-MM-dd"),
    inspection_time: format(new Date(), "HH:mm"),
  });

  const getRange = () => {
    if (rangeMode === "today") return getTodayRange();
    if (rangeMode === "month") return getCurrentCalendarMonthRange();
    if (rangeMode === "prev") return getPreviousCalendarMonthRange();
    return getCustomDateRange(customFrom, customTo);
  };
  const range = getRange();

  const { data: allInspections = [], isLoading } = useQuery({
    queryKey: ["cleaning-inspections"],
    queryFn: () => base44.entities.CleaningInspection.list("-created_date", 500),
  });

  const inspections = allInspections.filter(i => {
    const d = new Date(`${i.inspection_date}T${i.inspection_time || "00:00"}`).getTime();
    return d >= range.startMs && d <= range.endMs;
  }).filter(i => {
    if (filterArea !== "all" && i.area !== filterArea) return false;
    if (filterLow && Number(i.cleanliness_rating) > 5) return false;
    return true;
  });

  const avgCleanliness = inspections.length
    ? (inspections.reduce((s, i) => s + Number(i.cleanliness_rating), 0) / inspections.length).toFixed(1)
    : null;
  const lowCount = inspections.filter(i => Number(i.cleanliness_rating) <= 5).length;
  const followupCount = inspections.filter(i => i.requires_followup).length;
  const areaFreq = inspections.reduce((acc, i) => { acc[i.area] = (acc[i.area] || 0) + 1; return acc; }, {});
  const topArea = Object.entries(areaFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const num = `CL-${Date.now().toString().slice(-6)}`;
      return base44.entities.CleaningInspection.create({
        ...data,
        inspection_number: num,
        requires_followup: Number(data.cleanliness_rating) <= 5,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-inspections"] });
      setShowForm(false);
      setForm({ area: "", specific_location: "", cleanliness_rating: null, notes: "", photo_attachments: [], inspection_date: format(new Date(), "yyyy-MM-dd"), inspection_time: format(new Date(), "HH:mm") });
    },
  });

  const isValid = form.area && form.cleanliness_rating && form.inspection_date && form.inspection_time;

  return (
    <div className="max-w-5xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">בקרת ניקיון</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{inspections.length} בקרות בתקופה הנבחרת</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />פתח בקרת ניקיון
        </Button>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/40 rounded-xl border">
        {[["today","היום"],["month","החודש"],["prev","חודש קודם"],["custom","טווח מותאם"]].map(([k, l]) => (
          <Button key={k} variant={rangeMode === k ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setRangeMode(k)}>{l}</Button>
        ))}
        {rangeMode === "custom" && (
          <>
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-7 text-xs w-32" />
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-7 text-xs w-32" />
          </>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <MetricCard label="בקרות בתקופה" value={inspections.length} />
        <MetricCard label="דירוג ממוצע" value={avgCleanliness ? `${avgCleanliness}/10` : null} color="text-amber-600" />
        <MetricCard label="דירוגים נמוכים" value={lowCount} sub="דירוג 1–5" color={lowCount > 0 ? "text-red-600" : "text-muted-foreground"} />
        <MetricCard label="אזור עם הכי הרבה הערות" value={topArea || "—"} color="text-indigo-600" />
        <MetricCard label="דורשות טיפול" value={followupCount} color={followupCount > 0 ? "text-orange-600" : "text-muted-foreground"} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="אזור" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל האזורים</SelectItem>
            {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={filterLow ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilterLow(v => !v)}>
          דירוג נמוך בלבד
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">טוען...</div>
      ) : inspections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">אין בקרות</p>
            <p className="text-sm text-muted-foreground">לא נמצאו בקרות ניקיון בתקופה הנבחרת.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["תאריך","שעה","אזור","מיקום","דירוג","הערה","מבצע","דורש טיפול","תמונות"].map(h => (
                      <th key={h} className="text-right px-3 py-2.5 font-medium text-xs text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inspections.map(i => {
                    const r = Number(i.cleanliness_rating);
                    const rColor = r >= 9 ? "bg-emerald-100 text-emerald-700" : r >= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                    return (
                      <tr key={i.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">{i.inspection_date}</td>
                        <td className="px-3 py-2.5 text-xs">{i.inspection_time}</td>
                        <td className="px-3 py-2.5 text-xs">{i.area}</td>
                        <td className="px-3 py-2.5 text-xs">{i.specific_location || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${rColor}`}>{r}/10</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs max-w-[180px] truncate text-muted-foreground">{i.notes || "—"}</td>
                        <td className="px-3 py-2.5 text-xs">{i.created_by_name || i.created_by || "—"}</td>
                        <td className="px-3 py-2.5 text-center">
                          {i.requires_followup ? <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {i.photo_attachments?.length > 0 ? (
                            <div className="flex gap-1">
                              {i.photo_attachments.slice(0, 2).map((att, idx) => (
                                <a key={idx} href={att.file_url} target="_blank" rel="noopener noreferrer">
                                  <img src={att.file_url} alt="" className="w-8 h-8 object-cover rounded border" />
                                </a>
                              ))}
                              {i.photo_attachments.length > 2 && <span className="text-[10px] text-muted-foreground self-center">+{i.photo_attachments.length - 2}</span>}
                            </div>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New inspection dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>פתח בקרת ניקיון</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>תאריך *</Label>
                <Input type="date" value={form.inspection_date} onChange={e => update("inspection_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>שעה *</Label>
                <Input type="time" value={form.inspection_time} onChange={e => update("inspection_time", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>אזור *</Label>
              <Select value={form.area} onValueChange={v => update("area", v)}>
                <SelectTrigger><SelectValue placeholder="בחר אזור" /></SelectTrigger>
                <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>מיקום ספציפי</Label>
              <Input value={form.specific_location} onChange={e => update("specific_location", e.target.value)} placeholder="לדוג׳: שירותים גברים קומה 2" />
            </div>
            <div className="space-y-2">
              <Label>דירוג ניקיון 1-10 *</Label>
              <div className="flex flex-wrap gap-1.5">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <RatingButton key={n} value={n} selected={form.cleanliness_rating} onClick={v => update("cleanliness_rating", v)} />
                ))}
              </div>
              {form.cleanliness_rating && (
                <p className="text-xs text-muted-foreground">
                  {form.cleanliness_rating >= 9 ? "מצוין" : form.cleanliness_rating >= 6 ? "טוב" : form.cleanliness_rating >= 6 ? "סביר" : "דורש טיפול — יסומן אוטומטית"}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>הערות לשיפור</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="מה נמצא, מה צריך לשפר..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>תמונות בקרה</Label>
              <AttachmentUploader
                attachments={form.photo_attachments}
                onChange={v => update("photo_attachments", v)}
                label="צרף תמונת בקרה"
                helpText="לא חובה"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!isValid || createMutation.isPending}>
              שמור בקרה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}