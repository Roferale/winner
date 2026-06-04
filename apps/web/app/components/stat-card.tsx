import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  detail,
  icon,
  accent = "primary"
}: {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "danger";
}) {
  const iconColors: Record<string, string> = {
    primary: "var(--primary-soft)",
    success: "var(--success-soft)",
    warning: "var(--warning-soft)",
    danger:  "var(--danger-soft)"
  };
  const textColors: Record<string, string> = {
    primary: "var(--primary-dark)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger:  "var(--danger)"
  };

  return (
    <section className="stat-card" style={{ "--stat-accent": `var(--${accent})` } as React.CSSProperties}>
      <div className="stat-card-head">
        <span className="eyebrow" style={{ fontSize: 11 }}>{label}</span>
        {icon && (
          <span className="stat-card-icon" style={{ background: iconColors[accent], color: textColors[accent] }}>
            {icon}
          </span>
        )}
      </div>
      <strong className="stat-card-value">{value}</strong>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>{detail}</p>
    </section>
  );
}
