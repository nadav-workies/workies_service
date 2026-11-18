import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import TemplateStylePreview from "./TemplateStylePreview";
import TemplateTestButton from "./TemplateTestButton";

export default function StyleCard({ s, firstName }) {
  const swatches = [s.c.accent, s.c.band, s.c.surface, s.c.highlight].filter(Boolean);
  return <article className="flex flex-col rounded-xl border bg-card overflow-hidden">
    <div className="p-3" style={{ background: s.c.page }}><TemplateStylePreview s={s} firstName={firstName} /></div>
    <div className="flex flex-1 flex-col gap-3 border-t p-4">
      <div>
        <h3 className="font-semibold">{s.name}</h3>
        <p className="text-sm text-muted-foreground">{s.fits}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex gap-1">{swatches.map(x => <span key={x} className="h-4 w-4 rounded-full border" style={{ background: x }} />)}</span>
        <Lock className="w-3.5 h-3.5" />פלטה קבועה, לפי
        <Link to={s.page} target="_blank" className="text-primary underline-offset-2 hover:underline">עמוד הנחיתה</Link>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="font-mono text-xs text-muted-foreground" dir="ltr">{s.template}</span>
        <TemplateTestButton s={s} />
      </div>
    </div>
  </article>;
}