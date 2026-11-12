import { useState } from "react";
import { downloadMailingList, SEGMENTS } from "@/lib/mailingList";

export default function MailingListToolbar({ type, onType, search, onSearch, list, label }) {
  const [copied, setCopied] = useState(false);
  async function copyEmails() {
    await navigator.clipboard.writeText(list.map(r => r.email).join(", "));
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }
  return <>
    <div className="dt1-head">
      <div className="dt1-titles"><h3 className="dt1-title">רשימת תפוצה: {label}</h3><p className="dt1-meta">{list.length} אנשי קשר</p></div>
      <div className="dt1-tools-inline">
        <input className="dt1-search" value={search} onChange={e => onSearch(e.target.value)} placeholder="חיפוש שם, מייל או טלפון" aria-label="חיפוש ברשימה" />
        <button type="button" className="dt1-btn dt1-btn--ghost" onClick={copyEmails} disabled={!list.length}>{copied ? "הועתק" : "העתקת כל המיילים"}</button>
        <span className="dt1-export"><button type="button" className="dt1-btn" onClick={() => downloadMailingList(list, label)} disabled={!list.length}>
          <span className="dt1-beam-track" aria-hidden="true"><span className="dt1-beam" /></span>ייצוא CSV</button></span>
      </div>
    </div>
    <div className="dt1-toolwrap"><div className="dt1-tools"><div className="dt1-chips" role="group" aria-label="סוג עמוד">
      {SEGMENTS.map(([key, name], i) => <button key={key} type="button" className="dt1-fcard" aria-pressed={type === key} onClick={() => onType(key)}
        style={{ "--dt1-i": i, "--dt1-fc": "#f97015", "--dt1-fc-ink": "#14181f" }}>
        <span className="dt1-fcard-dot" aria-hidden="true" /><span className="dt1-fcard-name">{name}</span>
      </button>)}
    </div></div></div>
  </>;
}