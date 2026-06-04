export function SummaryPanel({
  title,
  rows
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <aside className="summary-panel">
      <div className="eyebrow">Resumo</div>
      <h4>{title}</h4>
      <div className="summary-panel-rows">
        {rows.map((row) => (
          <div key={row.label} className="summary-row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
