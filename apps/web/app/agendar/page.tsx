import { BookingForm } from "../components/booking-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getClasses() {
  const res = await fetch(`${API_URL}/booking/classes?date=${new Date().toISOString().split("T")[0]}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function AgendarPage() {
  const classes = await getClasses();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-block", background: "var(--primary)", color: "white", borderRadius: 999, padding: "4px 14px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Winner Academia de Tênis
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800 }}>Agende sua aula</h1>
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 15 }}>
            Escolha a turma e confirme sua presença em segundos.
          </p>
        </div>

        {/* Booking card */}
        <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", padding: 32, boxShadow: "var(--shadow-md)" }}>
          {classes.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-faint)" }}>
              Nenhuma turma disponível no momento.
            </p>
          ) : (
            <BookingForm classes={classes} apiUrl={API_URL} />
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-faint)" }}>
          Somente alunos cadastrados podem agendar · <a href="/dashboard" style={{ color: "var(--primary)" }}>Área administrativa</a>
        </p>
      </div>
    </main>
  );
}
