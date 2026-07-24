import { useState } from "react";
import { HelpCircle, X, CalendarDays, CheckSquare, ClipboardCheck, FileText, BarChart3, Bot } from "lucide-react";

const TIPS = [
  { icon: CalendarDays, title: "ניווט לפי ימים", body: "בחרו יום מסרגל הימים למעלה. כל יום מכיל את כל הפעילות — יחידות למידה, משימות, פגישות, מבדקים וסיכום יום." },
  { icon: CheckSquare, title: "סימון שלבים כהושלמו", body: "מנהלים יכולים ללחוץ על הצ'קבוקס ליד כל יחידת למידה כדי לסמן אותה כהושלמה במהירות." },
  { icon: ClipboardCheck, title: "סיום יום", body: "לאחר השלמת כל יחידות הלמידה של היום, מלאו את סיכום היום ולחצו על „סיום יום\" כדי לעבור ליום הבא." },
  { icon: FileText, title: "מבדקים", body: "המבדקים מופיעים בתוך היום שאליו הם שייכים. פתחו יחידת למידה ולחצו על „התחל מבדק\"." },
  { icon: BarChart3, title: "מידע נוסף", body: "מתחת לתוכן היום תמצאו אזור „מידע נוסף\" עם מפת החפיפה המלאה, כל המבדקים ויומן הפעילות." },
  { icon: Bot, title: "עוזר AI", body: "מעל סרגל הימים יש עוזר AI — שאלו אותו שאלות על תהליך החפיפה, השלבים והמבדקים." },
];

export default function OnboardingHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="עזרה והדרכה"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">מדריך מהיר</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="סגור">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              {TIPS.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{tip.title}</p>
                      <p className="text-muted-foreground leading-relaxed">{tip.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}