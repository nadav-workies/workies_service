import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PageHeader } from "@/components/mailing-mockup/shared";
import { MAIL_STYLES } from "@/lib/mailTemplates";
import { useTemplateStats } from "./useMailStats";
import StyleCard from "./StyleCard";
import SystemTemplatesTable from "./SystemTemplatesTable";

export default function MailTemplatesSection() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const stats = useTemplateStats();
  const firstName = (me.data?.full_name || "").trim().split(" ")[0] || "שלום";
  return <div className="space-y-6">
    <PageHeader title="טמפלטים" subtitle="שלושה סגנונות דיוור בשפה של עמודי הנחיתה. הפלטה והגופן של כל סגנון קבועים, והתוכן מתחלף לפי הקמפיין." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {MAIL_STYLES.map(s => <StyleCard key={s.key} s={s} firstName={firstName} />)}
    </div>
    <p className="text-xs text-muted-foreground">התוכן בתצוגה נלקח מעמודי הנחיתה הפעילים. מייל הבדיקה נשלח רק לכתובת שלך.</p>
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold">מיילים תפעוליים פעילים</h3>
        <p className="text-sm text-muted-foreground">אישורים ותזכורות שהמערכת שולחת אוטומטית. הנתונים מיומן ההודעות, מכל הזמנים.</p>
      </div>
      <SystemTemplatesTable stats={stats.data} />
    </section>
  </div>;
}