import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, BookOpen, Eye, PencilLine, CheckSquare, Users, ListChecks } from "lucide-react";

const TYPE_ICONS = {
  learning: BookOpen,
  observation: Eye,
  practice: PencilLine,
  live_task: CheckSquare,
  mentor_meeting: Users,
  summary: ListChecks,
};

export default function LearningChecklist({ items, checkedItems = [], onToggleItem }) {
  const [expandedItem, setExpandedItem] = useState(null);

  if (!items?.length) return null;

  const completed = checkedItems.filter(id => items.some(i => i.id === id)).length;
  const total = items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-muted-foreground">חומר למידה</p>
        <p className="text-xs text-muted-foreground">{completed}/{total} הושלמו</p>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isChecked = checkedItems.includes(item.id);
          const isExpanded = expandedItem === item.id;
          const Icon = TYPE_ICONS[item.type] || BookOpen;
          return (
            <div key={item.id} className={`rounded-lg ${isExpanded ? "bg-muted/30" : ""}`}>
              <div className="flex items-center gap-2 p-2 min-w-0">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleItem?.(item.id)}
                  className="shrink-0"
                />
                <Icon className={`w-4 h-4 shrink-0 ${isChecked ? "text-green-600" : "text-muted-foreground"}`} />
                <button
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  className="flex-1 text-right text-sm min-w-0 truncate"
                >
                  {item.title}
                </button>
                {item.summary && !isExpanded && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:block">{item.summary}</span>
                )}
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
              </div>
              {isExpanded && (
                <div className="pr-8 pb-3 space-y-1.5 text-xs text-muted-foreground">
                  {item.summary && <p className="text-foreground font-medium">{item.summary}</p>}
                  {item.details?.goal && <p><span className="font-semibold">מטרה:</span> {item.details.goal}</p>}
                  {item.details?.importance && <p><span className="font-semibold">חשיבות:</span> {item.details.importance}</p>}
                  {item.details?.steps?.length > 0 && (
                    <div>
                      <p className="font-semibold">שלבים:</p>
                      <ul className="list-disc pr-4 space-y-0.5">
                        {item.details.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {item.details?.example && <p><span className="font-semibold">דוגמה:</span> {item.details.example}</p>}
                  {item.details?.commonMistakes?.length > 0 && (
                    <div>
                      <p className="font-semibold">טעויות נפוצות:</p>
                      <ul className="list-disc pr-4 space-y-0.5">
                        {item.details.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                  {item.details?.nextAction && <p><span className="font-semibold">הפעולה הבאה:</span> {item.details.nextAction}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}