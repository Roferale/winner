export default function PageSkeleton() {
  return (
    <div className="content" style={{ gap: 14 }}>
      {/* Page header */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Bone w={56}  h={9}  />
            <Bone w={200} h={20} />
            <Bone w={300} h={12} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Bone w={88}  h={22} r={999} />
            <Bone w={110} h={22} r={999} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ ...card, padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--border-strong)", borderRadius: "2px 2px 0 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Bone w={72} h={10} />
              <Bone w={28} h={28} r={7} />
            </div>
            <Bone w={130} h={24} />
            <Bone w={90}  h={10} />
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Bone w={56}  h={9} />
            <Bone w={160} h={14} />
          </div>
          <Bone w={80} h={22} r={999} />
        </div>
        <div style={{ padding: "0 18px" }}>
          <div style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            {[180, 100, 90, 80, 90].map((w, i) => <Bone key={i} w={w} h={9} />)}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, width: 180 }}>
                <Bone w={160} h={12} />
                <Bone w={100} h={9} />
              </div>
              {[100, 90, 80, 90].map((w, j) => <Bone key={j} w={w} h={12} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "14px 20px",
  boxShadow: "var(--shadow-sm)",
};

function Bone({ w, h, r = 5 }: { w: number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: "var(--border)",
      animation: "skeleton-pulse 1.4s ease-in-out infinite",
    }} />
  );
}
