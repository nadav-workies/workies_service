import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { getQuizForStage, calculateQuizScore, isPassed, ONBOARDING_TEMPLATE } from "@/lib/onboardingTemplate";
import { logAudit } from "@/lib/onboardingUtils";

export default function QuizRunner({ stage, onboardingId, employee, user, onClose, onCompleted }) {
  const [phase, setPhase] = useState("quiz");
  const [answers, setAnswers] = useState({});
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const quiz = getQuizForStage(stage.template_stage_id);
  const templateStage = stage.template_stage_id === "summary"
    ? null
    : ONBOARDING_TEMPLATE.stages.find((s) => s.template_stage_id === stage.template_stage_id);
  const learningContent = templateStage?.learning_content_md;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  if (!quiz) return null;

  const handleSelect = (qIndex, option) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = async () => {
    const allAnswered = quiz.questions.every((_, i) => answers[i]);
    if (!allAnswered) return;

    setSubmitting(true);
    let correct = 0;
    const answerDetails = quiz.questions.map((q, i) => {
      const selected = answers[i];
      const isCorrect = selected === q.correct_option;
      if (isCorrect) correct++;
      return {
        question: q.question,
        selected,
        correct: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation,
        learning_reference: q.learning_reference || q.domain || "",
      };
    });

    const score = calculateQuizScore(correct, quiz.questions.length);
    const passed = isPassed(score);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const attemptNumber = (stage.quiz_attempts || 0) + 1;

    await base44.entities.QuizAttempt.create({
      onboarding_id: onboardingId,
      stage_id: stage.id,
      employee_id: employee.id || employee.employee_id,
      employee_name: employee.full_name || employee.employee_name,
      stage_title: stage.title,
      is_summary: stage.template_stage_id === "summary",
      attempt_number: attemptNumber,
      started_at: new Date(startTime).toISOString(),
      submitted_at: new Date().toISOString(),
      duration_seconds: duration,
      correct_answers: correct,
      total_questions: quiz.questions.length,
      score_1_to_10: score,
      passed,
      answers: answerDetails,
    });

    const newStatus = passed ? "completed" : (attemptNumber >= quiz.max_attempts ? "relearning" : "failed");
    await base44.entities.OnboardingStage.update(stage.id, {
      status: newStatus,
      quiz_score: score,
      quiz_attempts: attemptNumber,
      completed_at: passed ? new Date().toISOString() : null,
    });

    await logAudit(
      onboardingId,
      employee.id || employee.employee_id,
      employee.full_name || employee.employee_name,
      stage.id,
      stage.title,
      user?.full_name || user?.email || "משתמש/ת",
      `מבדק: ${stage.title} — ניסיון ${attemptNumber}, ציון ${score}/10, ${passed ? "עבר" : "נכשל"}`,
      null,
      `ציון: ${score}, סטטוס: ${newStatus}`
    );

    setResult({ score, correct, total: quiz.questions.length, passed, details: answerDetails, attemptNumber });
    setPhase("results");
    setSubmitting(false);
    onCompleted?.();
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>{quiz.title}</span>
            {phase === "quiz" && (
              <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatTime(elapsed)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {phase === "quiz" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              ניסיון {(stage.quiz_attempts || 0) + 1} מתוך {quiz.max_attempts} · ציון מעבר: {quiz.passing_score}
            </p>

            {learningContent && (
              <details className="text-xs bg-muted/30 rounded-lg p-2">
                <summary className="cursor-pointer font-semibold">חומר למידה</summary>
                <div className="mt-2 prose prose-sm max-w-none">
                  <ReactMarkdown>{learningContent}</ReactMarkdown>
                </div>
              </details>
            )}

            {quiz.questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                <RadioGroup value={answers[i] || ""} onValueChange={(v) => handleSelect(i, v)}>
                  {["a", "b", "c", "d"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`q${i}-${opt}`} />
                      <Label htmlFor={`q${i}-${opt}`} className="text-sm font-normal cursor-pointer">
                        {q.options[opt]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <Button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < quiz.questions.length}
              className="w-full gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              הגשת מבדק
            </Button>
          </div>
        )}

        {phase === "results" && result && (
          <div className="space-y-4">
            <div className={`text-center p-4 rounded-xl ${result.passed ? "bg-green-50" : "bg-red-50"}`}>
              <p className="text-3xl font-bold">
                {result.score}<span className="text-lg text-muted-foreground">/10</span>
              </p>
              <p className={`text-sm font-medium ${result.passed ? "text-green-600" : "text-red-600"}`}>
                {result.passed ? "✓ המבדק הושלם בהצלחה" : "הציון שהתקבל נמוך מציון המעבר"} · {result.correct} מתוך {result.total} נכונות
              </p>
              <p className="text-xs text-muted-foreground mt-1">ניסיון {result.attemptNumber}</p>
            </div>

            {result.details.map((d, i) => (
              <div key={i} className={`p-2 rounded-lg border ${d.is_correct ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}>
                <div className="flex items-start gap-2">
                  {d.is_correct
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{i + 1}. {d.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      התשובה שלך: <span className={d.is_correct ? "text-green-600" : "text-red-600"}>
                        {d.selected ? quiz.questions[i].options[d.selected] : "—"}
                      </span>
                    </p>
                    {!d.is_correct && (
                      <p className="text-xs text-green-600">
                        תשובה נכונה: {quiz.questions[i].options[d.correct]}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{d.explanation}</p>
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={onClose} variant="outline" className="w-full">סגור</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}