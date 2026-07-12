import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CalendarDays, Users } from "lucide-react";
import EventForm from "@/components/events/EventForm";
import RegistrationsTable from "@/components/events/RegistrationsTable";
import { isManagerOrAdmin } from "@/lib/slaUtils";
import { useNavigate } from "react-router-dom";

export default function EventsManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
      if (!u || !isManagerOrAdmin(u)) navigate("/");
    }).catch(() => { setLoading(false); navigate("/"); });
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['workies-events'],
    queryFn: () => base44.entities.WorkiesEvent.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: registrations = [], isLoading: regsLoading } = useQuery({
    queryKey: ['event-registrations'],
    queryFn: () => base44.entities.EventRegistration.list('-registered_at', 2000),
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: async (eventId) => {
      // Archive all currently active events
      const activeEvents = events.filter(e => e.is_active && e.id !== eventId);
      for (const e of activeEvents) {
        await base44.entities.WorkiesEvent.update(e.id, {
          is_active: false,
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_by: user?.email || user?.full_name || 'מנהל',
        });
      }
      // Activate the new event
      await base44.entities.WorkiesEvent.update(eventId, {
        is_active: true,
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workies-events'] });
    },
  });

  if (loading || !user) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const activeEvent = events.find(e => e.is_active && e.status === 'active');
  const activeEventRegistrations = activeEvent
    ? registrations.filter(r => r.event_id === activeEvent.id)
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5" />
        <h1 className="text-xl font-bold">אירועים והרשמות</h1>
      </div>

      <Tabs defaultValue="event">
        <TabsList>
          <TabsTrigger value="event" className="gap-1.5"><CalendarDays className="w-3.5 h-3.5" />ניהול אירוע</TabsTrigger>
          <TabsTrigger value="registrations" className="gap-1.5"><Users className="w-3.5 h-3.5" />רשימת נרשמים</TabsTrigger>
        </TabsList>

        <TabsContent value="event">
          <EventForm
            events={events}
            activeEvent={activeEvent}
            isLoading={eventsLoading}
            user={user}
            onActivate={(id) => activateMutation.mutate(id)}
            activating={activateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="registrations">
          <RegistrationsTable
            registrations={activeEventRegistrations}
            activeEvent={activeEvent}
            isLoading={regsLoading}
            user={user}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}