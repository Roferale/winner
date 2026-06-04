export function ActionBar({
  primary,
  secondary
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="action-bar">
      <div>{secondary}</div>
      <div className="action-bar-primary">{primary}</div>
    </div>
  );
}
