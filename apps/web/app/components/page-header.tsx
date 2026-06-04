export function PageHeader({
  eyebrow,
  title,
  description,
  right
}: {
  eyebrow: string;
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 3 }}>{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {right ? <div className="page-header-actions">{right}</div> : null}
    </header>
  );
}
