import DailyOfficeLeadForm from "@/components/landing/DailyOfficeLeadForm";

export default function DailyOffice() {
  return (
    <main dir="rtl" className="daily-office-theme font-body min-h-screen bg-background text-foreground px-4 py-7 sm:py-10">
      <div className="mx-auto max-w-md space-y-5">
        <header className="text-center space-y-3">
          <img src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/1c0d76342_1.png" alt="Workies" width="104" height="72" className="w-24 h-16 object-contain mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">וורקיז באר שבע</p>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold leading-tight tracking-tight">משרד יומי<br /><span className="text-primary">להתנסות</span></h1>
          <p className="text-lg sm:text-xl font-bold">ללא עלות וללא התחייבות</p>
          <div aria-hidden="true" className="h-1 w-14 bg-primary mx-auto" />
        </header>
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
          <img src="https://media.base44.com/images/public/6a1d5a36316988d9f113f88e/97a837415_1.png" alt="משרד במתחם וורקיז" width="576" height="1024" fetchPriority="high" className="w-full h-44 sm:h-56 object-cover object-center" />
          <section aria-label="הרשמה להתנסות במשרד יומי" className="relative border-t-4 border-primary bg-card text-card-foreground p-5 sm:p-6">
            <DailyOfficeLeadForm />
          </section>
        </div>
      </div>
    </main>
  );
}