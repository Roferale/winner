"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)", fontSize: 14, color: "var(--text)",
  background: "var(--surface)", outline: "none", fontFamily: "inherit",
};

export default function LoginPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const next         = params.get("next") ?? "/dashboard";

  const [cnpj,     setCnpj]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const fmtCnpj = (v: string) =>
    v.replace(/\D/g, "").slice(0, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/(\d{4})(\d)/, "$1-$2");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyCnpj: cnpj.replace(/\D/g, ""),
          email,
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Credenciais inválidas");

      // Armazena token em cookie via API route
      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: json.accessToken }),
      });

      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "32px 16px", background: "var(--bg)"
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: 14, background: "var(--primary)",
            marginBottom: 14, boxShadow: "0 4px 16px var(--primary-glow)"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Winner Academia
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)" }}>
            Acesso ao painel financeiro
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)", padding: "28px 26px",
          boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 16
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              CNPJ da empresa
            </label>
            <input
              style={inp} type="text" placeholder="00.000.000/0000-00"
              value={cnpj} onChange={e => setCnpj(fmtCnpj(e.target.value))}
              maxLength={18} required autoFocus
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              E-mail
            </label>
            <input
              style={inp} type="email" placeholder="admin@academia.com.br"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inp, paddingRight: 40 }}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)", display: "flex" }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 13px", background: "var(--danger-soft)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--danger)", border: "1px solid var(--danger-soft)" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px", background: loading ? "var(--surface-soft)" : "var(--primary)",
              color: loading ? "var(--text-soft)" : "white", border: "none",
              borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 2px 10px var(--primary-glow)",
              transition: "all var(--t-base)"
            }}
          >
            <LogIn size={15} />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--text-faint)" }}>
          Aluno?{" "}
          <a href="/cliente" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Acesse o portal do aluno
          </a>
        </p>
      </div>
    </main>
  );
}
