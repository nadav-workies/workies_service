import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import "@/components/messages/messagesTable.css";
import MessageFilterPills from "@/components/messages/MessageFilterPills";
import MessageRow from "@/components/messages/MessageRow";
import MessagesPager from "@/components/messages/MessagesPager";
import MessageDetailDialog from "@/components/messages/MessageDetailDialog";
import MessagesArchive from "@/components/messages/MessagesArchive";
import MessagesTableHead from "@/components/messages/MessagesTableHead";
import { PER_PAGE, SOURCE_LABELS, sourceOf, sentAt, downloadCsv } from "@/components/messages/messageConfig";

const LIFECYCLE = { pending: 0, sent: 1, skipped: 2, failed: 3 };
const SORT_VALUE = { order: (l) => sentAt(l) || "", customer: (l) => l.recipient_email || "", email: (l) => l.subject || "", total: (l) => SOURCE_LABELS[sourceOf(l)] || "", status: (l) => LIFECYCLE[l.status] ?? 9 };
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function MessagesTable() {
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState({ key: "order", dir: "desc" });
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState({});
  const [open, setOpen] = useState(null);
  const [entering, setEntering] = useState(true);

  useEffect(() => { const t = setTimeout(() => setEntering(false), 1100); return () => clearTimeout(t); }, []);
  useEffect(() => { const t = setTimeout(() => setTerm(search.trim()), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [status, source, term]);

  const base = useMemo(() => ({
    not_relevant: { $ne: true },
    ...(source !== "all" ? { source } : {}),
    ...(term ? { $or: [{ recipient_email: { $regex: escapeRegex(term) } }, { subject: { $regex: escapeRegex(term) } }] } : {}),
  }), [source, term]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["message-logs", base, status],
    queryFn: () => base44.entities.NotificationLog.filter({ ...base, ...(status !== "all" ? { status } : {}) }, "-created_date", 500),
  });
  const { data: counts = {} } = useQuery({
    queryKey: ["message-log-counts", base],
    queryFn: async () => {
      const { rows } = await base44.entities.NotificationLog.aggregate({ query: base, groupBy: "status" });
      const out = { all: 0 };
      rows.forEach((r) => { out[r.status] = r.count; out.all += r.count; });
      return out;
    },
  });

  const list = useMemo(() => {
    const get = SORT_VALUE[sort.key];
    return [...logs].sort((a, b) => {
      const av = get(a), bv = get(b);
      const c = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv), "he");
      return sort.dir === "asc" ? c : -c;
    });
  }, [logs, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const slice = list.slice(start, start + PER_PAGE);
  const selected = list.filter((l) => picked[l.id]);
  const toggle = (id) => setPicked((p) => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = true; return n; });
  const onSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "order" ? "desc" : "asc" }));
  const pageAll = slice.length > 0 && slice.every((l) => picked[l.id]);
  const togglePage = () => setPicked((p) => { const n = { ...p }; slice.forEach((l) => { if (pageAll) delete n[l.id]; else n[l.id] = true; }); return n; });

  return <section className="dt1-section" dir="rtl" {...(entering ? { "data-dt1-enter": "" } : {})}>
    <div className="dt1-card" data-dt1-bulk={selected.length ? "on" : "off"}>
      <div className="dt1-head">
        <div className="dt1-titles">
          <h3 className="dt1-title">הודעות אוטומטיות</h3>
          <p className="dt1-meta">{counts.all ?? 0} הודעות · {PER_PAGE} בעמוד</p>
        </div>
        <div className="dt1-tools-inline">
          <input className="dt1-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי נמען או נושא" aria-label="חיפוש הודעות" />
          <select className="dt1-select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="סינון לפי אזור">
            <option value="all">כל האזורים</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="dt1-export">
            <button type="button" className="dt1-btn" onClick={() => downloadCsv(list)} disabled={!list.length}>
              <span className="dt1-beam-track" aria-hidden="true"><span className="dt1-beam" /></span>ייצוא CSV
            </button>
          </span>
        </div>
      </div>
      <div className="dt1-toolwrap">
        <div className="dt1-tools"><MessageFilterPills status={status} counts={counts} onChange={setStatus} /></div>
        <div className="dt1-bulk" aria-live="polite">
          <span className="dt1-bulk-n">{selected.length} נבחרו</span>
          <span className="dt1-spacer" />
          <button type="button" className="dt1-btn dt1-btn--ghost" onClick={() => setPicked({})}>ניקוי</button>
          <button type="button" className="dt1-btn" onClick={() => downloadCsv(selected)}>
            <span className="dt1-beam-track" aria-hidden="true"><span className="dt1-beam" /></span>ייצוא הנבחרות
          </button>
        </div>
      </div>
      <div className="dt1-tablewrap">
        {isLoading ? <div className="dt1-skel" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="dt1-skel-row" />)}</div>
          : !list.length ? <div className="dt1-empty"><span className="dt1-empty-ico"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.3" /><path d="M1.75 6.25h12.5M6 6.25v7" stroke="currentColor" strokeWidth="1.3" /></svg></span>
            <span className="dt1-empty-t">אין הודעות שתואמות לסינון</span><p className="dt1-empty-p">כל מייל אוטומטי שהמערכת שולחת, מקריאות שירות ועד תזכורות ולידים, יופיע כאן.</p></div>
          : <table className="dt1-table">
            <MessagesTableHead sort={sort} onSort={onSort} pageAll={pageAll} pageSome={slice.some((l) => picked[l.id])} onTogglePage={togglePage} />
            <tbody className="dt1-tbody">{slice.map((l, i) => <MessageRow key={l.id} log={l} index={i} selected={!!picked[l.id]} onToggle={toggle} onOpen={setOpen} />)}</tbody>
          </table>}
      </div>
      {!isLoading && list.length > 0 && <MessagesPager page={current} pages={pages} shown={slice.length} start={start} total={list.length} onPage={setPage} />}
    </div>
    <MessagesArchive onOpen={setOpen} />
    <MessageDetailDialog log={open} onClose={() => setOpen(null)} />
  </section>;
}