import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Star } from "lucide-react";

function RatingSelector({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
            value === n
              ? n <= 5 ? "bg-red-500 border-red-500 text-white" : n <= 7 ? "bg-amber-500 border-amber-500 text-white" : "bg-emerald-500 border-emerald-500 text-white"
              : "border-border hover:border-primary hover:bg-primary/5"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function FeedbackSurvey() {
  const { token } = useParams();
  const [state, setState] = useState("loading"); // loading | not_found | already_done | form | submitted
  const [ticket, setTicket] = useState(null);
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) { setState("not_found"); return; }
      const tickets = await base44.entities.ServiceTicket.filter({ feedback_token: token });
      if (!tickets.length) { setState("not_found"); return; }
      const t = tickets[0];
      if (t.feedback_submitted) { setState("already_done"); return; }
      setTicket(t);
      // load template
      const templates = await base44.entities.SurveyTemplate.filter({ key: "service_ticket_feedback" });
      setTemplate(templates[0] || null);
      setState("form");
    }
    load().catch(() => setState("not_found"));
  }, [token]);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!ticket) return;
    const questions = template?.questions?.sort((a,b) => a.order - b.order) || [];
    // validate required
    for (const q of questions) {
      if (q.required && !answers[q.question_id]) return;
    }

    const rating = Number(answers["service_rating"]) || null;
    if (!rating || rating < 1 || rating > 10) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const comment = answers["service_comment"] || "";

    const answerArray = questions.map(q => ({
      question_id: q.question_id,
      question_label: q.label,
      answer: String(answers[q.question_id] || ""),
      numeric_value: Number(answers[q.question_id]) || null,
    }));

    // Save SurveyResponse
    await base44.entities.SurveyResponse.create({
      survey_template_key: "service_ticket_feedback",
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      feedback_token: token,
      customer_name: ticket.customer_name,
      customer_email: ticket.created_by,
      room_number: ticket.room_number,
      room_label: ticket.room_label,
      ticket_type: ticket.ticket_type,
      assigned_to: ticket.assigned_to,
      rating,
      comment,
      answers: answerArray,
      submitted_at: now,
    });

    // Update ServiceTicket
    const isLowRating = rating && rating <= 5;
    await base44.entities.ServiceTicket.update(ticket.id, {
      feedback_submitted: true,
      feedback_rating: rating,
      feedback_comment: comment,
      feedback_submitted_at: now,
      ...(isLowRating && {
        requires_manager_followup: true,
        google_review_blocked_reason: "דירוג שביעות רצון נמוך",
      }),
    });

    // Notify managers on low rating
    if (isLowRating) {
      base44.functions.invoke("ticketNotifications", {
        action: "low_rating_alert",
        ticket: { ...ticket, feedback_rating: rating, feedback_comment: comment },
        rating,
        comment,
      }).catch(() => {});
    }

    setSubmitting(false);
    setState("submitted");
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <p className="text-lg font-semibold mb-2">הקישור אינו תקין</p>
            <p className="text-muted-foreground text-sm">הקישור אינו תקין או שפג תוקפו.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "already_done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold mb-2">תודה על המשוב!</p>
            <p className="text-muted-foreground text-sm">המשוב לקריאה זו כבר התקבל.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold mb-2">תודה!</p>
            <p className="text-muted-foreground text-sm">המשוב שלך התקבל בהצלחה. זה עוזר לנו להשתפר.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = template?.questions?.sort((a, b) => a.order - b.order) || [
    { question_id: "service_rating", label: "איך היית מדרג את חוויית השירות שקיבלת?", type: "rating_1_10", required: true, order: 1, help_text: "10 = מעל לציפיות, 5 = סביר, 1 = טעון שיפור" },
    { question_id: "service_comment", label: "נשמח לשמוע בקצרה מה עבד טוב או מה כדאי לשפר", type: "text", required: false, order: 2, help_text: "שדה זה אינו חובה" },
  ];

  const isValid = questions.filter(q => q.required).every(q => answers[q.question_id]);

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center" dir="rtl">
      <div className="max-w-lg w-full space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold mb-3">
            <Star className="w-4 h-4" /> Workies
          </div>
          <h1 className="text-xl font-bold">{template?.name || "סקר חוויית שירות"}</h1>
          {ticket && (
            <p className="text-sm text-muted-foreground mt-1">
              קריאה {ticket.ticket_number} | {ticket.room_label ? `חדר ${ticket.room_label}` : ticket.public_area_label || ""}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {questions.map(q => (
              <div key={q.question_id} className="space-y-2">
                <p className="font-medium text-sm">
                  {q.label}
                  {q.required && <span className="text-destructive mr-1">*</span>}
                </p>
                {q.help_text && <p className="text-xs text-muted-foreground">{q.help_text}</p>}

                {q.type === "rating_1_10" && (
                  <RatingSelector value={answers[q.question_id]} onChange={v => handleAnswer(q.question_id, v)} />
                )}

                {q.type === "text" && (
                  <Textarea
                    value={answers[q.question_id] || ""}
                    onChange={e => handleAnswer(q.question_id, e.target.value)}
                    placeholder="כתוב כאן..."
                    rows={3}
                  />
                )}

                {q.type === "yes_no" && (
                  <div className="flex gap-3">
                    {["כן", "לא"].map(opt => (
                      <button key={opt} type="button"
                        onClick={() => handleAnswer(q.question_id, opt)}
                        className={`px-6 py-2 rounded-lg border-2 font-medium transition-all ${answers[q.question_id] === opt ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              שלח משוב
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}