"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PaymentForm } from "../../components/payment-form";
import { DEMO } from "../../lib/demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const IS_DEMO = API_URL.includes("localhost");

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px" }}>
      <div style={{ width:"100%",maxWidth:460 }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <span style={{ display:"inline-block",background:"var(--primary)",color:"white",borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10 }}>
            Winner Academia de Tênis
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}

export default function PagarPage() {
  const params = useParams();
  const id = params.id as string;
  const [entry, setEntry] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not_found" | "settled" | "cancelled">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;

    if (IS_DEMO) {
      const demo = DEMO.entries.find((e: any) => e.id === id);
      setEntry(demo ?? null);
      setStatus(demo ? "found" : "not_found");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    fetch(`${API_URL}/payment/${id}`, { cache: "no-store", signal: controller.signal })
      .then(res => {
        clearTimeout(timeout);
        if (!res.ok) { setStatus("not_found"); return; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setEntry(data);
        if (data.status === "SETTLED")   setStatus("settled");
        else if (data.status === "CANCELLED") setStatus("cancelled");
        else setStatus("found");
      })
      .catch(() => {
        clearTimeout(timeout);
        setStatus("not_found");
      });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [id, attempt]);

  if (status === "loading") return (
    <Shell>
      <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:40,textAlign:"center" }}>
        <Loader2 size={36} style={{ color:"var(--primary)",marginBottom:16,animation:"spin 1s linear infinite" }} />
        <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Carregando cobrança...</h2>
        <p style={{ margin:0,color:"var(--text-soft)",fontSize:13 }}>Isso pode levar até 1 minuto na primeira vez.</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </Shell>
  );

  if (status === "not_found") return (
    <Shell>
      <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:32,textAlign:"center" }}>
        <XCircle size={40} style={{ color:"var(--danger)",marginBottom:12 }} />
        <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Cobrança não encontrada</h2>
        <p style={{ margin:"0 0 20px",color:"var(--text-soft)",fontSize:14 }}>O sistema pode estar inicializando. Tente novamente.</p>
        <button
          onClick={() => { setStatus("loading"); setAttempt(a => a + 1); }}
          style={{ padding:"10px 24px",background:"var(--primary)",color:"white",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer" }}
        >
          Tentar novamente
        </button>
      </div>
    </Shell>
  );

  if (status === "settled") return (
    <Shell>
      <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:32,textAlign:"center" }}>
        <CheckCircle size={40} style={{ color:"var(--success)",marginBottom:12 }} />
        <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Já pago!</h2>
        <p style={{ margin:0,color:"var(--text-soft)",fontSize:14 }}>Esta cobrança já foi quitada. Obrigado!</p>
      </div>
    </Shell>
  );

  if (status === "cancelled") return (
    <Shell>
      <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:32,textAlign:"center" }}>
        <XCircle size={40} style={{ color:"var(--danger)",marginBottom:12 }} />
        <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Cobrança cancelada</h2>
        <p style={{ margin:0,color:"var(--text-soft)",fontSize:14 }}>Entre em contato com a academia.</p>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",boxShadow:"var(--shadow-md)",overflow:"hidden" }}>
        <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",background:"var(--surface-soft)" }}>
          <p style={{ margin:"0 0 4px",fontSize:12,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Cobrança</p>
          <h1 style={{ margin:"0 0 12px",fontSize:18,lineHeight:1.3 }}>{entry.description}</h1>
          <div style={{ display:"flex",alignItems:"baseline",gap:12,flexWrap:"wrap" }}>
            <span style={{ fontSize:30,fontWeight:800,color:"var(--text)" }}>{fmtCurrency(entry.amount)}</span>
            <span style={{ fontSize:13,color:"var(--text-soft)" }}>Vencimento: {fmtDate(entry.dueDate)}</span>
          </div>
        </div>
        <div style={{ padding:"20px 24px" }}>
          <PaymentForm entry={entry} apiUrl={API_URL} />
        </div>
      </div>
    </Shell>
  );
}
