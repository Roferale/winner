export function LaunchCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section-card launch-card">
      <div className="section-card-header">
        <div>
          <div className="eyebrow">Lancamento</div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
