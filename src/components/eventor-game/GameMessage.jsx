export default function GameMessage({ title, children }) {
  return <section className="eg-card" role="status">
    {title && <h2 className="eg-card-title">{title}</h2>}
    {children && <p>{children}</p>}
  </section>;
}