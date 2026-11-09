import { SOURCE_LABELS, STATUS_META, sourceOf, sentAt, formatDate } from "@/components/messages/messageConfig";

const CHECK = <svg className="dt1-check-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>;

export default function MessageRow({ log, index, selected, onToggle, onOpen }) {
  const meta = STATUS_META[log.status];
  const email = log.recipient_email || "—";
  return <tr className="dt1-row" style={{ "--dt1-i": index }} data-dt1-sel={selected ? "1" : "0"} onClick={() => onOpen(log)}>
    <td className="dt1-cell dt1-cell--pick" onClick={(e) => e.stopPropagation()}>
      <span className="dt1-rowline" aria-hidden="true" />
      <label className="dt1-check">
        <input type="checkbox" className="dt1-check-input" checked={selected} onChange={() => onToggle(log.id)} aria-label={`בחירת הודעה אל ${email}`} />
        <span className="dt1-check-box" aria-hidden="true">{CHECK}</span>
      </label>
    </td>
    <td className="dt1-cell dt1-cell--order"><span className="dt1-order"><bdi dir="ltr">{formatDate(sentAt(log))}</bdi></span></td>
    <td className="dt1-cell dt1-cell--cust"><span className="dt1-avatar" aria-hidden="true">{email.slice(0, 2)}</span><span className="dt1-name" dir="ltr">{email}</span></td>
    <td className="dt1-cell dt1-cell--email"><span className="dt1-email" title={log.subject}>{log.subject || log.notification_key}</span></td>
    <td className="dt1-cell dt1-cell--total"><span className="dt1-total">{SOURCE_LABELS[sourceOf(log)]}</span></td>
    <td className="dt1-cell dt1-cell--status"><span className={`dt1-badge dt1-badge--${meta?.badge || "refunded"}`}>{meta?.label || log.status}</span></td>
  </tr>;
}