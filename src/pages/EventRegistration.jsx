import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, CalendarPlus, AlertCircle, CalendarX, Sparkles } from "lucide-react";
import { downloadICS, buildGoogleCalendarLink } from "@/lib/icsGenerator";
import PublicEventHero from "@/components/events/PublicEventHero";
import PublicRegistrationForm from "@/components/events/PublicRegistrationForm";

export default function EventRegistration() {
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [submittedName, setSubmittedName] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    base44.functions
      .invoke("eventRegistrationHandler", { action: "get_active_event" })
      .then((res) => {
        setEventData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (formData) => {
    setError("");
    if (!formData.full_name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setError("יש למלא שם מלא, טלפון ומייל");
      return;
    }
    if (Number(formData.participants_count) < 1) {
      setError("כמות משתתפים חייבת להיות לפחות 1");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("eventRegistrationHandler", {
        action: "submit_registration",
        event_id: eventData.event.id,
        ...formData,
        participants_count: Number(formData.participants_count),
        children_count: Number(formData.children_count),
      });
      setSubmitted(res.data);
      setSubmittedName(formData.full_name);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err.response?.data?.error || "שגיאה בשליחת ההרשמה. נסה שנית.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eventData?.event) {
    return <EventClosed ended={eventData?.event_ended} eventName={eventData?.event_name} />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <PublicEventHero
          event={eventData.event}
          remainingCapacity={eventData.remaining_capacity}
          totalParticipants={eventData.total_participants}
          waitlistCount={eventData.waitlist_count}
        />
        <div ref={formRef} className="max-w-2xl mx-auto px-4 py-10">
          <SuccessState result={submitted} event={eventData.event} fullName={submittedName} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <PublicEventHero
        event={eventData.event}
        remainingCapacity={eventData.remaining_capacity}
        totalParticipants={eventData.total_participants}
        waitlistCount={eventData.waitlist_count}
        onRegister={scrollToForm}
      />
      <div ref={formRef}>
        <PublicRegistrationForm
          event={eventData.event}
          remainingCapacity={eventData.remaining_capacity}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Workies באר שבע · אליהו נאווי 24</span>
        </div>
      </footer>
    </div>
  );
}

function EventClosed({ ended, eventName }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-5 flex items-center justify-center">
          <CalendarX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {ended ? "האירוע כבר התקיים" : "ההרשמה לאירוע הסתיימה"}
        </h1>
        {eventName && <p className="text-muted-foreground mb-1">{eventName}</p>}
        <p className="text-sm text-muted-foreground">
          {ended
            ? "האירוע כבר עבר. נשמח לראותך באירועים הבאים!"
            : "כרגע אין אירוע פתוח להרשמה."}
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Workies באר שבע</span>
        </div>
      </div>
    </div>
  );
}

function SuccessState({ result, event, fullName }) {
  const fullEvent = { ...event, id: result.registration_id };
  return (
    <div className="bg-card rounded-2xl border shadow-lg p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold mb-1">ההרשמה התקבלה!</h2>
      <p className="text-muted-foreground mb-1">שלום {fullName},</p>
      <p className="text-sm text-muted-foreground mb-4">נרשמת בהצלחה לאירוע:</p>
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
        <p className="text-xs text-muted-foreground mb-4">
          הערה: לא הצלחנו לשלוח מייל אישור, אך ההרשמה נשמרה בהצלחה.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <Button onClick={() => downloadICS(fullEvent)} variant="outline" className="gap-2 h-11">
          <CalendarPlus className="w-4 h-4" />הורד קובץ יומן (ICS)
        </Button>
        <a
          href={result.gcal_link || buildGoogleCalendarLink(fullEvent)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial"
        >
          <Button className="gap-2 h-11 w-full">
            <CalendarPlus className="w-4 h-4" />הוסף ליומן Google
          </Button>
        </a>
      </div>

      <div className="mt-8 p-4 bg-muted/40 rounded-xl text-right text-sm space-y-1">
        <p>
          <strong>מיקום:</strong> {result.event?.location_name}, {result.event?.location_address}
        </p>
        <p>
          <strong>תאריך:</strong> {result.event?.event_date}
        </p>
        <p>
          <strong>שעת הגעה:</strong> {result.event?.arrival_time}
        </p>
      </div>
    </div>
  );
}