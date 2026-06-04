import { PackageSearch } from "lucide-react";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <PackageSearch size={20} />
      </div>
      <strong style={{ fontSize: 14, color: "var(--text)" }}>{title}</strong>
      <p style={{ maxWidth: 280 }}>{description}</p>
    </div>
  );
}
