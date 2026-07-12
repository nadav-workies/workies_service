import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, Baby, Clock, CheckCircle, XCircle } from "lucide-react";

export default function RegistrationKPIs({ registrations }) {
  const active = registrations.filter(r => r.registration_status !== 'cancelled');
  const totalParticipants = active.reduce((s, r) => s + (Number(r.participants_count) || 0) + (Number(r.children_count) || 0), 0);
  const activeTenants = active.filter(r => r.is_active_tenant).length;
  const newPeople = active.filter(r => !r.is_active_tenant).length;
  const children = active.reduce((s, r) => s + (Number(r.children_count) || 0), 0);
  const waitlist = registrations.filter(r => r.registration_status === 'waitlist').length;
  const attended = registrations.filter(r => r.registration_status === 'attended').length;
  const noShow = registrations.filter(r => r.registration_status === 'no_show').length;

  const items = [
    { label: 'סה״כ נרשמים', value: active.length, icon: Users, color: 'text-blue-600' },
    { label: 'סה״כ משתתפים', value: totalParticipants, icon: UserCheck, color: 'text-green-600' },
    { label: 'דיירים פעילים', value: activeTenants, icon: UserCheck, color: 'text-indigo-600' },
    { label: 'חדשים / לא מזוהים', value: newPeople, icon: UserPlus, color: 'text-amber-600' },
    { label: 'ילדים', value: children, icon: Baby, color: 'text-pink-600' },
    { label: 'רשימת המתנה', value: waitlist, icon: Clock, color: 'text-orange-600' },
    { label: 'הגיעו', value: attended, icon: CheckCircle, color: 'text-green-600' },
    { label: 'לא הגיעו', value: noShow, icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {items.map((item, i) => (
        <Card key={i} className="p-3">
          <div className="flex items-center gap-2">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}