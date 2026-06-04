import { History } from "lucide-react";

export function AuditTimeline({
  items
}: {
  items: Array<{ id: string; entity: string; action: string; createdAt: string; meta?: string }>;
}) {
  return (
    <div className="audit-timeline">
      {items.map((item) => (
        <div key={item.id} className="audit-timeline-item">
          <div className="audit-timeline-icon">
            <History size={14} />
          </div>
          <div>
            <strong>{item.entity}</strong>
            <p>{item.action}</p>
            {item.meta ? <span>{item.meta}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
