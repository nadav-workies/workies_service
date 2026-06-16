import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Filter, CheckCircle, AlertTriangle, LayoutDashboard, Maximize2, X } from "lucide-react";
import { format } from "date-fns";
import AttachmentUploader from "@/components/tickets/AttachmentUploader";
import { getTodayRange, getCurrentCalendarMonthRange, getPreviousCalendarMonthRange, getCustomDateRange } from "@/lib/dateRangeUtils";

const AREAS = ["שירותים", "מטבחון", "מסדרון", "לאונג׳", "Open Space", "חדר ישיבות", "חלל ציבורי", "משרד", "אחר"];

const QUICK_ROOMS = [
  { label: "חדרי שירותים", rooms: [
    { label: "וורקיז 1", area: "שירותים", location: "וורקיז 1" },
    { label: "וורקיז 2", area: "שירותים", location: "וורקיז 2" },
    { label: "וורקיז 3", area: "שירותים", location: "וורקיז 3" },
  ]},
  { label: "חדרי ישיבות", rooms: [
    { label: "חדר 28", area: "חדר ישיבות", location: "חדר ישיבות 28" },
    { label: "חדר 8", area: "חדר ישיבות", location: "חדר ישיבות 8" },
    { label: "חדר 74", area: "חדר ישיבות", location: "חדר ישיבות 74" },
    { label: "חדר 70", area: "חדר ישיבות", location: "חדר ישיבות 70" },
  ]},
  { label: "אחר", rooms: [
    { label: "משרד", area: "משרד", location: "משרד" },
    { label: "גרין רום 26", area: "אחר", location: "גרין רום 26" },
  ]},
];

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
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [quickPreset, setQuickPreset] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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

  const handleQuickOpen = (room) => {
    setQuickPreset(room);
    setForm({
      area: room.area,
      specific_location: room.location,
      cleanliness_rating: 8,
      notes: "",
      photo_attachments: [],
      inspection_date: format(new Date(), "yyyy-MM-dd"),
      inspection_time: format(new Date(), "HH:mm"),
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setQuickPreset(null);
  };

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
      setQuickPreset(null);
      setForm({ area: "", specific_location: "", cleanliness_rating: null, notes: "", photo_attachments: [], inspection_date: format(new Date(), "yyyy-MM-dd"), inspection_time: format(new Date(), "HH:mm") });
    },
  });

  const isValid = form.area && form.cleanliness_rating && form.inspection_date && form.inspection_time;

  return (
    <div className="max-w-5xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LayoutDashboard className="w-3.5 h-3.5" />דשבורד
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">בקרת ניקיון</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{inspections.length} בקרות בתקופה הנבחרת</p>
        </div>
        <Button className="gap-2" onClick={() => { setQuickPreset(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" />פתח בקרת ניקיון
        </Button>
      </div>

      {/* Quick action buttons */}
      <div className="space-y-2">
        {QUICK_ROOMS.map(group => (
          <div key={group.label} className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground shrink-0">{group.label}:</span>
            {group.rooms.map(room => (
              <Button
                key={room.label}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => handleQuickOpen(room)}
              >
                <Plus className="w-3 h-3" />{room.label}
              </Button>
            ))}
          </div>
        ))}
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
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPreviewImage(att.file_url)}
                                  className="relative group/thumb cursor-zoom-in"
                                >
                                  <img src={att.file_url} alt="" className="w-8 h-8 object-cover rounded border group-hover/thumb:opacity-80 transition-opacity" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                    <Maximize2 className="w-3 h-3 text-white drop-shadow-lg" />
                                  </div>
                                </button>
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
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) handleCloseForm(); }}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{quickPreset ? `בקרת ניקיון — ${quickPreset.label}` : "פתח בקרת ניקיון"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {quickPreset ? (
              <>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">אזור:</span>
                    <span className="font-medium">{quickPreset.area}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">מיקום:</span>
                    <span className="font-medium">{quickPreset.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">תאריך:</span>
                    <span className="font-medium">{form.inspection_date}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>דירוג ניקיון 1-10 *</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <RatingButton key={n} value={n} selected={form.cleanliness_rating} onClick={v => update("cleanliness_rating", v)} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>הערות</Label>
                  <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="מה צריך לשפר? (לא חובה)" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>תמונות בקרה</Label>
                  <AttachmentUploader
                    attachments={form.photo_attachments}
                    onChange={v => update("photo_attachments", v)}
                    label="צרף תמונה"
                    helpText="לא חובה"
                  />
                </div>
              </>
            ) : (
              <>
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
                      {form.cleanliness_rating >= 9 ? "מצוין" : form.cleanliness_rating >= 6 ? "טוב" : "דורש טיפול — יסומן אוטומטית"}
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
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm}>ביטול</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!isValid || createMutation.isPending}>
              {createMutation.isPending ? "שומר..." : "שמור בקרה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Image preview lightbox */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-black/90 border-none" onClick={() => setPreviewImage(null)}>
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          {previewImage && (
            <img src={previewImage} alt="תצוגה מקדימה" className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}