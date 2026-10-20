import DailyOfficeLeadForm from "@/components/landing/DailyOfficeLeadForm";
import "@/components/landing/Podcast.css";

export default function Podcast() {
  return <main dir="rtl" className="podcast-theme bg-background text-foreground font-body">
    <div className="max-w-6xl mx-auto md:grid md:grid-cols-2">
      <header className="text-center px-6 pt-9 pb-8 md:col-span-2">
        <div className="podcast-brand" dir="ltr" aria-label="Workies">Work<span className="text-primary">i</span>es</div>
        <p dir="ltr" className="text-[10px] tracking-[.3em] mt-2">WORK · MEET · GROW</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mt-8 leading-tight">אולפן הפודקאסט<span className="block text-primary">להתנסות</span></h1>
        <div className="w-12 h-1 bg-primary mx-auto mt-5" />
        <p className="font-medium mt-4">מקום לקול ולסיפור שלכם. וורקיז באר שבע.</p>
      </header>
      <div className="podcast-photo relative overflow-hidden md:rounded-tr-3xl">
        <img className="absolute inset-0 w-full h-full object-cover" src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/23dac1d15_IMG-20261016-WA00121.jpg" alt="אולפן הפודקאסט של וורקיז, כורסאות טורקיז ומיקרופונים מול קיר עץ" fetchPriority="high" />
      </div>
      <section aria-label="הרשמה להתנסות בפודקאסט" className="bg-secondary text-secondary-foreground px-6 py-8 md:p-12 md:flex md:flex-col md:justify-center md:rounded-tl-3xl">
        <DailyOfficeLeadForm campaign="podcast" />
        <p dir="ltr" className="text-center text-[10px] tracking-[.25em] mt-9 opacity-70">MORE THAN AN OFFICE</p>
      </section>
    </div>
  </main>;
}