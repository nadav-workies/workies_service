import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarDays, MapPin, Clock, Users, CheckCircle2, CalendarPlus, AlertCircle } from "lucide-react";
import { downloadICS, buildGoogleCalendarLink } from "@/lib/icsGenerator";

export default function EventRegistration() {
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", participants_count: 1, children_count: 0, notes: "" });

  useEffect(() => {
    base44.functions.invoke('eventRegistrationHandler', { action: 'get_active_event' })
      .then(res => { setEventData(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError("יש למלא שם מלא, טלפון ומייל");
      return;
    }
    if (Number(form.participants_count) < 1) {
      setError("כמות משתתפים חייבת להיות לפחות 1");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('eventRegistrationHandler', {
        action: 'submit_registration',
        event_id: eventData.event.id,
        ...form,
        participants_count: Number(form.participants_count),
        children_count: Number(form.children_count),
      });
      setSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "שגיאה בשליחת ההרשמה. נסה שנית.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 to-background" dir="rtl">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground py-4 px-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">W</span>
          </div>
          <span className="font-bold">Workies באר שבע</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {!eventData?.event ? (
          <NoActiveEvent />
        ) : submitted ? (
          <SuccessState result={submitted} event={eventData.event} fullName={form.full_name} />
        ) : (
          <EventDetailsAndForm
            eventData={eventData}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </main>
    </div>
  );
}

function NoActiveEvent() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
        <CalendarDays className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold mb-2">ההרשמה לאירוע הסתיימה</h1>
      <p className="text-muted-foreground">כרגע אין אירוע פתוח להרשמה.</p>
    </div>
  );
}

function SuccessState({ result, event, fullName }) {
  const fullEvent = { ...event, id: result.registration_id };
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold mb-2">ההרשמה התקבלה!</h1>
      <p className="text-muted-foreground mb-1">שלום {fullName}, נרשמת בהצלחה לאירוע:</p>
      <p className="font-semibold text-lg mb-1">{result.event?.event_name}</p>
      <p className="text-sm text-muted-foreground mb-4">
        {result.event?.event_date} · שעת הגעה: {result.event?.arrival_time}
      </p>

      {result.is_full && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">
          <AlertCircle className="w-4 h-4 inline-block ml-1" />
          האירוע מלא. נרשמת לרשימת המתנה. ניצור איתך קשר אם יתפנה מקום.
        </div>
      )}

      {result.is_active_tenant && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
          זיהינו אותך כדייר פעיל ב־Workies! 👋
        </div>
      )}

      {!result.email_sent && (
        <p className="text-xs text-muted-foreground mb-4">הערה: לא הצלחנו לשלוח מייל אישור, אך ההרשמה נשמרה בהצלחה.</p>
      )}

      {/* Calendar buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <Button onClick={() => downloadICS(fullEvent)} variant="outline" className="gap-2">
          <CalendarPlus className="w-4 h-4" />הורד קובץ יומן (ICS)
        </Button>
        <a href={result.gcal_link || buildGoogleCalendarLink(fullEvent)} target="_blank" rel="noopener noreferrer">
          <Button className="gap-2 w-full sm:w-auto">
            <CalendarPlus className="w-4 h-4" />הוסף ליומן Google
          </Button>
        </a>
      </div>

      <div className="mt-8 p-4 bg-muted/40 rounded-xl text-right text-sm space-y-1">
        <p><strong>מיקום:</strong> {result.event?.location_name}, {result.event?.location_address}</p>
        <p><strong>תאריך:</strong> {result.event?.event_date}</p>
        <p><strong>שעת הגעה:</strong> {result.event?.arrival_time}</p>
      </div>
    </div>
  );
}

function EventDetailsAndForm({ eventData, form, setForm, onSubmit, submitting, error }) {
  const { event, remaining_capacity, total_participants, waitlist_count } = eventData;
  const isFull = remaining_capacity <= 0;

  return (
    <div className="space-y-6">
      {/* Event details */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-primary/5 p-6 border-b">
          <h1 className="text-2xl font-bold mb-2">{event.event_name}</h1>
          {event.event_description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.event_description}</p>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={CalendarDays} label="תאריך" value={event.event_date} />
          <DetailRow icon={Clock} label="שעת הגעה" value={event.arrival_time} />
          {event.event_start_time && <DetailRow icon={Clock} label="שעת התחלה" value={event.event_start_time} />}
          <DetailRow icon={MapPin} label="מיקום" value={`${event.location_name}, ${event.location_address}`} />
        </div>
        <div className="px-6 pb-6">
          <div className={`rounded-lg p-3 flex items-center justify-between ${isFull ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <span className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {isFull ? 'האירוע מלא' : `נותרו ${remaining_capacity} מקומות`}
            </span>
            <span className="text-xs text-muted-foreground">
              {total_participants}/{event.capacity} רשומים
              {waitlist_count > 0 && ` · ${waitlist_count} ברשימת המתנה`}
            </span>
          </div>
        </div>
      </div>

      {/* Registration form */}
      <form onSubmit={onSubmit} className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-lg">טופס הרשמה</h2>

        {isFull && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            האירוע מלא. ניתן להירשם לרשימת המתנה — ניצור איתך קשר אם יתפנה מקום.
          </div>
        )}

        <div>
          <Label>שם מלא *</Label>
          <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="ישראל ישראלי" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>טלפון *</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0501234567" required dir="ltr" />
          </div>
          <div>
            <Label>מייל *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" required dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>כמות משתתפים *</Label>
            <Input type="number" min="1" value={form.participants_count} onChange={e => setForm(f => ({ ...f, participants_count: e.target.value }))} required />
          </div>
          <div>
            <Label>כמות ילדים</Label>
            <Input type="number" min="0" value={form.children_count} onChange={e => setForm(f => ({ ...f, children_count: e.target.value }))} />
          </div>
        </div>
        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="הערות נוספות (לא חובה)" rows={2} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {isFull ? 'הרשם לרשימת המתנה' : 'הירשם לאירוע'}
        </Button>
      </form>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}