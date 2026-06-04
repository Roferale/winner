"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const fmt = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

function StatusIcon({ status }: { status: string }) {
  if (status === "SETTLED")    return <CheckCircle size={16} style={{ color: "var(--success)" }} />;
  if (status === "OVERDUE")    return <AlertTriangle size={16} style={{ color: "var(--warning)" }} />;
  return <Clock size={16} style={{ color: "var(--primary)" }} />;
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    OPEN:              ["Em aberto",   "var(--primary)"],
    SETTLED:           ["Pago",        "var(--success)"],
    OVERDUE:           ["Vencido",     "var(--warning)"],
    PARTIALLY_SETTLED: ["Parcial",     "var(--primary)"],
    CANCELLED:         ["Cancelado",   "var(--text-faint)"]
  };
  const [label, color] = map[status] ?? ["—", "var(--text-faint)"];
  return <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>;
}

export default function CobrancasPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const router                = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("cliente_token");
    if (!token) { router.replace("/cliente"); return; }

    fetch(`${API_URL}/cliente/cobrancas`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error("Sessão expirada"); return r.json(); })
      .then(setData)
      .catch(() => { sessionStorage.clear(); router.replace("/cliente"); })
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    sessionStorage.clear();
    router.replace("/cliente");
  }

  if (loading) return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--text-soft)" }}>Carregando...</p>
    </main>
  );
  if (error) return <main style={{ padding: 32 }}><p style={{ color: "var(--danger)" }}>{error}</p></main>;
  if (!data)  return null;

  const open     = data.entries.filter((e: any) => e.status !== "SETTLED" && e.status !== "CANCELLED");
  const settled  = data.entries.filter((e: any) => e.status === "SETTLED");

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: 4 }}>
            Winner Academia de Tênis
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
            Olá, {data.person?.legalName?.split(" ")[0] ?? "Aluno"}!
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)" }}>Suas cobranças</p>
        </div>
        <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", fontSize: 13, cursor: "pointer", color: "var(--text-soft)" }}>
          <LogOut size={14} /> Sair
        </button>
      </div>

      {/* Em aberto */}
      {open.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-soft)" }}>
            Em aberto ({open.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {open.map((entry: any) => (
              <div key={entry.id} style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", padding: "16px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-soft)" }}>
                      <span>Venc. {fmtDate(entry.dueDate)}</span>
                      <StatusIcon status={entry.status} />
                      <StatusLabel status={entry.status} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{fmt(entry.amount)}</div>
                    <button
                      onClick={() => router.push(`/cliente/pagar/${entry.id}`)}
                      style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      <CreditCard size={13} /> Pagar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {open.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-soft)" }}>
          <CheckCircle size={36} style={{ color: "var(--success)", marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Nenhuma cobrança em aberto!</p>
        </div>
      )}

      {/* Pagas */}
      {settled.length > 0 && (
        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-soft)" }}>
            Pagas ({settled.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {settled.map((entry: any) => (
              <div key={entry.id} style={{ background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.description}</div>
                  <div style={{ fontSize: 12, color: "var(--text-soft)" }}>Venc. {fmtDate(entry.dueDate)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>{fmt(entry.amount)}</div>
                  <StatusLabel status={entry.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
