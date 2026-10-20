import DailyOfficeLeadForm from "@/components/landing/DailyOfficeLeadForm";

export default function DailyOffice() {
  return (
    <main dir="rtl" className="daily-office-theme font-body relative isolate min-h-screen bg-primary text-primary-foreground px-5 py-8 sm:py-10">
      <img src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/97a837415_1.png" alt="" width="576" height="1024" fetchPriority="high" className="absolute inset-0 -z-20 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-primary/90" />
      <div className="mx-auto max-w-md space-y-6">
        <header className="text-center space-y-4">
          <div className="inline-flex rounded-full bg-background p-3"><img src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/1c0d76342_1.png" alt="Workies" width="104" height="72" className="w-24 h-16 object-contain" /></div>
          <p className="text-sm font-medium">וורקיז באר שבע</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold leading-tight">משרד יומי<br />להתנסות</h1>
          <p className="text-xl sm:text-2xl font-medium">ללא עלות וללא התחייבות</p>
        </header>
        <section aria-label="הרשמה להתנסות במשרד יומי" className="rounded-2xl bg-card text-card-foreground p-5 sm:p-6 shadow-xl border border-border">
          <DailyOfficeLeadForm />
        </section>
      </div>
    </main>
  );
}