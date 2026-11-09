import EditableImage from "@/components/landing/EditableImage";

export default function HRLecture({ lecture, editor, alt }) {
  return <section className={alt ? "hr-lecture hr-lecture-alt" : "hr-lecture"} aria-labelledby={lecture.speaker.slot}>
    <div className="hr-wrap hr-lecture-grid">
      <div>
        <p className="hr-eyebrow-dark">{lecture.eyebrow}</p>
        <h2 id={lecture.speaker.slot} className="hr-h2">{lecture.title}</h2>
      </div>
      <div>
        <h3 className="hr-h3">{lecture.question}</h3>
        {lecture.body.map(p => <p key={p} className="hr-p">{p}</p>)}
        <div className="hr-byline">
          <EditableImage editor={editor} slot={lecture.speaker.slot} alt={lecture.speaker.name} placeholder="" className="hr-avatar-sm" />
          <div><b>{lecture.speaker.name}</b><span>{lecture.speaker.short}</span></div>
        </div>
      </div>
    </div>
  </section>;
}