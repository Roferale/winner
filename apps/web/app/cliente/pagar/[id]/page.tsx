"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, ExternalLink, ArrowLeft, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const fmt = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

function GatewayBtn({ logo, name, desc, onClick, loading }: { logo: string; name: string; desc: string; onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 10,
      cursor: loading ? "not-allowed" : "pointer", textAlign: "left", transition: "border-color 0.15s"
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{logo}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{desc}</div>
      </div>
      <ExternalLink size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
    </button>
  );
}

export default function ClientePagarPage() {
  const { id }              = useParams<{ id: string }>();
  const router              = useRouter();
  const [entry, setEntry]   = useState<any>(null);
  const [loading, setLoad]  = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError]   = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("cliente_token");
    if (!token) { router.replace("/cliente"); return; }

    fetch(`${API_URL}/payment/${id}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject("not found"))
      .then(setEntry)
      .catch(() => setError("Cobrança não encontrada."))
      .finally(() => setLoad(false));
  }, [id, router]);

  async function pay(gateway: "mp" | "pagseguro") {
    const token = sessionStorage.getItem("cliente_token");
    if (!token) { router.replace("/cliente"); return; }
    setPaying(gateway); setError("");
    try {
      const res  = await fetch(`${API_URL}/cliente/pagar/${id}/${gateway}`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      const url = json.sandboxUrl ?? json.checkoutUrl;
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao abrir checkout");
      setPaying(null);
    }
  }

  if (loading) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p style={{ color: "var(--text-soft)" }}>Carregando...</p></main>;
  if (error && !entry) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}><p style={{ color: "var(--danger)" }}>{error}</p></main>;

  if (entry?.status === "SETTLED") return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <CheckCircle size={48} style={{ color: "var(--success)", marginBottom: 16 }} />
        <h2 style={{ margin: "0 0 8px" }}>Cobrança já paga!</h2>
        <p style={{ margin: "0 0 20px", color: "var(--text-soft)" }}>Esta cobrança já foi quitada.</p>
        <button onClick={() => router.push("/cliente/cobrancas")} style={{ padding: "10px 24px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
          Minhas cobranças
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px" }}>
      <button onClick={() => router.push("/cliente/cobrancas")} style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={14} /> Voltar
      </button>

      {/* Detalhe da cobrança */}
      <div style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", padding: "18px 20px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: 6 }}>Cobrança</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{entry?.description}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Vencimento: {entry ? new Date(entry.dueDate).toLocaleDateString("pt-BR") : "—"}</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>{entry ? fmt(entry.amount) : ""}</span>
        </div>
      </div>

      {/* Escolha do gateway */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-soft)", marginBottom: 10 }}>Escolha como pagar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <GatewayBtn logo="💙" name="Mercado Pago" desc="PIX, cartão de crédito/débito e boleto" onClick={() => pay("mp")} loading={paying === "mp"} />
          <GatewayBtn logo="🟡" name="PagSeguro / PagBank" desc="PIX, cartão de crédito/débito e boleto" onClick={() => pay("pagseguro")} loading={paying === "pagseguro"} />
        </div>
      </div>

      {paying && <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-soft)" }}>Abrindo checkout seguro...</p>}

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--danger-soft)", borderRadius: 8, fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* PCI note */}
      <div style={{ display: "flex", gap: 8, padding: "12px 14px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-soft)" }}>
        <ShieldCheck size={15} style={{ color: "var(--success)", flexShrink: 0, marginTop: 1 }} />
        <span>Você será redirecionado para o checkout seguro do gateway. Seus dados de pagamento <strong>nunca passam pelos nossos servidores</strong> — PCI DSS Level 1.</span>
      </div>
    </main>
  );
}
