import { useEffect } from 'react';
import HRMeetupForm from '@/components/landing/hr/HRMeetupForm';
import '@/components/landing/hr/HRMeetup.css';

export default function ThankYou() {
  const campaign = sessionStorage.getItem('workies_lead_campaign');
  useEffect(() => { document.title = 'תודה | Workies'; }, []);
  return <main dir="rtl" lang="he" className="min-h-screen bg-background text-foreground font-body flex items-center justify-center p-6">
    <section className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center space-y-4">
      <p className="text-primary font-bold text-xl">Workies</p>
      <h1 className="text-3xl font-bold">תודה על הפנייה!</h1>
      <p className="text-muted-foreground">הפרטים התקבלו ונשמרו.</p>
      {campaign === 'hr_meetup' && <div className="hr-page text-right"><HRMeetupForm /></div>}
    </section>
  </main>;
}