export function FormSection({
  title,
  description,
  columns = 2,
  children
}: {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="form-section-header">
        <h4>{title}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      <div className={`form-section-grid cols-${columns}`}>{children}</div>
    </section>
  );
}
