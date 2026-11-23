import { LETTERS, QUESTIONS, percentages } from "@/lib/eventorGame";

// Answer rows with yellow bars for one question.
export default function HostRows({ qi, counts }) {
  const { pct } = percentages(counts);
  return <ul className="eh-rows" style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {QUESTIONS[qi].o.map((txt, i) => <li key={i}>
      <div className="eh-row-head"><span>{LETTERS[i]}. {txt}</span><b>{pct[i]}% ({counts[i]})</b></div>
      <div className="eh-bar" aria-hidden="true"><span style={{ width: `${pct[i]}%` }} /></div>
    </li>)}
  </ul>;
}