import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Loader2, Star } from 'lucide-react';

export default function FeedbackModal({ ticket, user, open, onClose, onSubmitted }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    const now = new Date().toISOString();
    await base44.entities.ServiceFeedback.create({
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer_email: user?.email || ticket.created_by || '',
      customer_name: ticket.customer_name || user?.full_name || '',
      rating,
      comment,
      submitted_at: now,
    });
    await base44.entities.ServiceTicket.update(ticket.id, {
      feedback_rating: rating,
      feedback_comment: comment,
      feedback_submitted_at: now,
    });
    setSaving(false);
    setDone(true);
    setTimeout(() => { onSubmitted?.(); onClose(); }, 1800);
  };

  const RATING_LABELS = { 1:'גרוע', 2:'', 3:'', 4:'', 5:'סביר', 6:'', 7:'', 8:'', 9:'', 10:'מעולה!' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>דרג את חוויית השירות</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-semibold text-green-700">תודה, המשוב שלך התקבל!</p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground text-center">10 = מעל לציפיות · 5 = סביר · 1 = טעון שיפור</p>

            {/* Rating grid */}
            <div className="grid grid-cols-10 gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`h-9 rounded-lg text-sm font-bold border transition-all ${
                    rating === n
                      ? n <= 3 ? 'bg-red-500 text-white border-red-500'
                        : n <= 6 ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-card border-border hover:border-primary'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {rating && (
              <p className="text-center text-sm font-medium">
                {rating <= 3 ? '😞 טעון שיפור' : rating <= 6 ? '😐 סביר' : rating <= 8 ? '😊 טוב' : '🌟 מעולה!'}
              </p>
            )}

            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="הערות נוספות (לא חובה)..."
              rows={2}
              className="text-sm"
            />
          </div>
        )}

        {!done && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>ביטול</Button>
            <Button onClick={handleSubmit} disabled={!rating || saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin ml-1" />שולח...</> : 'שלח משוב'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}