import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Users, Baby } from "lucide-react";

export default function PublicRegistrationForm({ event, remainingCapacity, onSubmit, submitting, error }) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    participants_count: 1,
    children_count: 0,
    notes: "",
  });

  const isFull = remainingCapacity <= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border shadow-lg p-5 sm:p-8 space-y-5"
      >
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">טופס הרשמה</h2>
          <p className="text-sm text-muted-foreground mt-1">
            מלא/י את הפרטים ונשלח לך אישור במייל
          </p>
        </div>

        {isFull && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
            האירוע מלא. ניתן להירשם לרשימת המתנה — ניצור איתך קשר אם יתפנה מקום.
          </div>
        )}

        <div>
          <Label className="mb-1.5 block font-medium">שם מלא *</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="ישראל ישראלי"
            required
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block font-medium">טלפון *</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="0501234567"
              required
              dir="ltr"
              className="h-11 text-right"
            />
          </div>
          <div>
            <Label className="mb-1.5 block font-medium">מייל *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
              required
              dir="ltr"
              className="h-11 text-right"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5" /> משתתפים *
            </Label>
            <Input
              type="number"
              min="1"
              value={form.participants_count}
              onChange={(e) => setForm((f) => ({ ...f, participants_count: e.target.value }))}
              required
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-center gap-1 font-medium">
              <Baby className="w-3.5 h-3.5" /> ילדים
            </Label>
            <Input
              type="number"
              min="0"
              value={form.children_count}
              onChange={(e) => setForm((f) => ({ ...f, children_count: e.target.value }))}
              className="h-11"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block font-medium">הערות</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="הערות נוספות (לא חובה)"
            rows={2}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-bold gap-2 rounded-xl"
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {isFull ? "הירשם לרשימת המתנה" : "אישור הרשמה"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ההרשמה חינמית · נשלח אישור וקישור ליומן למייל שלך
        </p>
      </form>
    </div>
  );
}