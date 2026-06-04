import { CheckCircle, XCircle } from "lucide-react";
import { PaymentForm } from "../../components/payment-form";
import { DEMO } from "../../lib/demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getEntry(id: string) {
  try {
    const res = await fetch(`${API_URL}/payment/${id}`, { cache: "no-store" });
    if (!res.ok) {
      // Fallback: busca no demo-data pelo id
      return DEMO.entries.find((e: any) => e.id === id) ?? null;
    }
    return res.json();
  } catch {
    return DEMO.entries.find((e: any) => e.id === id) ?? null;
  }
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

export default async function PagarPage({ params }: { params: { id: string } }) {
  const entry = await getEntry(params.id);

  const shell = (children: React.ReactNode) => (
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

  if (!entry) return shell(
    <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:32,textAlign:"center" }}>
      <XCircle size={40} style={{ color:"var(--danger)",marginBottom:12 }} />
      <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Cobrança não encontrada</h2>
      <p style={{ margin:0,color:"var(--text-soft)",fontSize:14 }}>Este link de pagamento é inválido ou expirou.</p>
    </div>
  );

  if (entry.status === "SETTLED") return shell(
    <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:32,textAlign:"center" }}>
      <CheckCircle size={40} style={{ color:"var(--success)",marginBottom:12 }} />
      <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Já pago!</h2>
      <p style={{ margin:0,color:"var(--text-soft)",fontSize:14 }}>Esta cobrança já foi quitada. Obrigado!</p>
    </div>
  );

  if (entry.status === "CANCELLED") return shell(
    <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",padding:32,textAlign:"center" }}>
      <XCircle size={40} style={{ color:"var(--danger)",marginBottom:12 }} />
      <h2 style={{ margin:"0 0 8px",fontSize:18 }}>Cobrança cancelada</h2>
      <p style={{ margin:0,color:"var(--text-soft)",fontSize:14 }}>Entre em contato com a academia.</p>
    </div>
  );

  return shell(
    <div style={{ background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",boxShadow:"var(--shadow-md)",overflow:"hidden" }}>
      {/* Header da cobrança */}
      <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",background:"var(--surface-soft)" }}>
        <p style={{ margin:"0 0 4px",fontSize:12,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.08em" }}>
          Cobrança
        </p>
        <h1 style={{ margin:"0 0 12px",fontSize:18,lineHeight:1.3 }}>{entry.description}</h1>
        <div style={{ display:"flex",alignItems:"baseline",gap:12,flexWrap:"wrap" }}>
          <span style={{ fontSize:30,fontWeight:800,color:"var(--text)" }}>{fmtCurrency(entry.amount)}</span>
          <span style={{ fontSize:13,color:"var(--text-soft)" }}>Vencimento: {fmtDate(entry.dueDate)}</span>
        </div>
      </div>

      {/* Formulário de pagamento */}
      <div style={{ padding:"20px 24px" }}>
        <PaymentForm entry={entry} apiUrl={API_URL} />
      </div>
    </div>
  );
}
