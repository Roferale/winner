import { ClienteLoginForm } from "../components/cliente-login-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function ClientePortalPage() {
  return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-block", background: "var(--primary)", color: "white", borderRadius: 999, padding: "3px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Winner Academia de Tênis
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800 }}>Portal do Aluno</h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-soft)" }}>Acesse suas cobranças e realize pagamentos</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", padding: "28px 24px" }}>
          <ClienteLoginForm apiUrl={API_URL} />
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-faint)" }}>
          Área administrativa? <a href="/dashboard" style={{ color: "var(--primary)", fontWeight: 600 }}>Entrar no ERP</a>
        </p>
      </div>
    </main>
  );
}
