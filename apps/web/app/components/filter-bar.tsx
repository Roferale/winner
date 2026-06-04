export function FilterBar({
  items
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="filter-bar">
      {items.map((item) => (
        <label key={item.label} className="filter-field">
          <span>{item.label}</span>
          <div className="filter-value">{item.value}</div>
        </label>
      ))}
    </div>
  );
}
