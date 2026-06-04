export function DataTable({
  children,
  dense = false
}: {
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <div className={dense ? "data-table dense" : "data-table"}>
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    </div>
  );
}
