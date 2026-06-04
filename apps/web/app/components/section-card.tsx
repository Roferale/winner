export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  children,
  compact = false
}: {
  title: string;
  eyebrow: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "section-card compact" : "section-card"}>
      <div className="section-card-header">
        <div>
          <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 2 }}>{eyebrow}</div>
          <h3>{title}</h3>
          {description ? <p style={{ marginTop: 2 }}>{description}</p> : null}
        </div>
        {actions ? <div className="section-card-actions">{actions}</div> : null}
      </div>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
