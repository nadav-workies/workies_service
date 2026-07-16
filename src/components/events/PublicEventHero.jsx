import { CalendarDays, Clock, MapPin, Users, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

export default function PublicEventHero({ event, remainingCapacity, totalParticipants, waitlistCount, onRegister }) {
  const isFull = remainingCapacity <= 0;
  const capacityPct = Math.min(100, Math.round((totalParticipants / event.capacity) * 100));

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-orange-600 text-white">
      {/* Decorative shapes */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white"></div>
        <div className="absolute top-40 -left-16 w-48 h-48 rounded-full bg-white"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-14">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="font-extrabold text-base">W</span>
          </div>
          <div>
            <span className="font-bold text-sm block">Workies באר שבע</span>
            <span className="text-[10px] opacity-70">אירוע קהילה</span>
          </div>
        </div>

        {/* Event name */}
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">{event.event_name}</h1>

        {event.event_description && (
          <p className="text-white/85 text-sm sm:text-lg mb-6 max-w-2xl whitespace-pre-wrap leading-relaxed">
            {event.event_description}
          </p>
        )}

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <InfoBadge icon={CalendarDays} text={formatDate(event.event_date)} />
          <InfoBadge icon={Clock} text={`הגעה ${event.arrival_time}`} />
          {event.event_start_time && <InfoBadge icon={Clock} text={`התחלה ${event.event_start_time}`} />}
          <InfoBadge icon={MapPin} text={event.location_name} />
        </div>

        {/* Capacity bar */}
        <div className="bg-white/15 backdrop-blur rounded-2xl p-3.5 sm:p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {isFull ? "האירוע מלא" : `נותרו ${remainingCapacity} מקומות`}
            </span>
            <span className="text-xs opacity-80">
              {totalParticipants}/{event.capacity} רשומים
              {waitlistCount > 0 && ` · ${waitlistCount} ברשימת המתנה`}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-red-300" : "bg-white"}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={onRegister}
          size="lg"
          className="bg-white text-primary hover:bg-white/90 gap-2 font-bold text-base h-12 px-8 rounded-xl shadow-lg"
        >
          {isFull ? "הירשם לרשימת המתנה" : "הירשם עכשיו"}
          <ArrowDown className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function InfoBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium">
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
}