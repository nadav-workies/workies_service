export default function AIRecommendationsView({ rec }) {
  if (!rec) return null;
  const Section = ({ title, children }) => (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground">{title}</p>
      {children}
    </div>
  );
  const List = ({ items }) => (
    <ul className="list-disc pr-4 text-xs space-y-0.5">
      {(items || []).map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  );

  return (
    <div className="border rounded-lg p-2.5 bg-muted/20 space-y-2">
      <p className="text-xs font-bold">המלצות AI</p>
      {rec.recommended_hook && <Section title="הוק מומלץ"><p className="text-xs">{rec.recommended_hook}</p></Section>}
      {rec.recommended_angles?.length > 0 && <Section title="זוויות מומלצות"><List items={rec.recommended_angles} /></Section>}
      {rec.recommended_structure && <Section title="מבנה מומלץ"><p className="text-xs whitespace-pre-wrap">{rec.recommended_structure}</p></Section>}
      {rec.key_messages?.length > 0 && <Section title="מסרים מרכזיים"><List items={rec.key_messages} /></Section>}
      {rec.what_not_to_say?.length > 0 && <Section title="ממה להימנע"><List items={rec.what_not_to_say} /></Section>}
      {rec.missing_information?.length > 0 && (
        <Section title="מידע חסר">
          <List items={rec.missing_information} />
        </Section>
      )}
    </div>
  );
}