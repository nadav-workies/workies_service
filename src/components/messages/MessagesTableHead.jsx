import { useEffect, useRef } from "react";

const COLS = [["order", "תאריך שליחה"], ["cust", "נמען", "customer"], ["email", "נושא"], ["total", "אזור"], ["status", "סטטוס"]];
const ARROW = <svg className="dt1-sort-ind" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" /></svg>;

export default function MessagesTableHead({ sort, onSort, pageAll, pageSome, onTogglePage }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = pageSome && !pageAll; }, [pageSome, pageAll]);
  return <thead className="dt1-thead"><tr>
    <th className="dt1-th dt1-th--pick" scope="col">
      <label className="dt1-check">
        <input ref={ref} type="checkbox" className="dt1-check-input" checked={pageAll} onChange={onTogglePage} aria-label="בחירת כל ההודעות בעמוד" />
        <span className="dt1-check-box" aria-hidden="true"><svg className="dt1-check-icon" viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></span>
      </label>
    </th>
    {COLS.map(([cls, label, key = cls]) => <th key={cls} className={`dt1-th dt1-th--${cls}`} scope="col"
      aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
      <button type="button" className="dt1-sort" onClick={() => onSort(key)}>{label} {ARROW}</button>
    </th>)}
  </tr></thead>;
}