export default function Loading() {
  return (
    <main className="loading-screen">
      <div className="loading-shell">
        <div className="loading-sidebar" />
        <div className="loading-content">
          <div className="loading-bar" />
          <div className="loading-grid">
            <div className="loading-card tall" />
            <div className="loading-card" />
            <div className="loading-card" />
            <div className="loading-card wide" />
          </div>
        </div>
      </div>
    </main>
  );
}
