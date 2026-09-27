import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CommonTopics({ quickTicket, value, onPick }) {
  const { data: recent = [] } = useQuery({
    queryKey: ["common-topics", quickTicket.ticket_type],
    queryFn: () => base44.entities.ServiceTicket.filter({ ticket_type: quickTicket.ticket_type }, "-created_date", 40),
    staleTime: 300000,
  });

  const fromExamples = (quickTicket.examples || "").split(/[,/]|—/).map(s => s.trim()).filter(s => s.length > 1);
  const counts = {};
  recent.forEach(t => {
    const d = (t.issue_description || "").trim();
    if (d && d.length <= 40) counts[d] = (counts[d] || 0) + 1;
  });
  const fromHistory = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([d]) => d);
  const topics = [...new Set([...fromHistory, ...fromExamples])].slice(0, 8);

  if (!topics.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {topics.map(t => (
        <button key={t} type="button" onClick={() => onPick(t)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${value === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}