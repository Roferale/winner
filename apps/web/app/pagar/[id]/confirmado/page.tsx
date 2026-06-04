import { CheckCircle } from "lucide-react";

// Não chama /pay aqui — a baixa deve vir exclusivamente do webhook do Mercado Pago.
// Chamar /pay nesta página seria um retry cego que poderia forçar baixa sem pagamento real.

export default function ConfirmadoPage() {
  return (
    <main style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px" }}>
      <div style={{ width:"100%",maxWidth:420,background:"var(--surface)",borderRadius:14,border:"1px solid var(--border)",boxShadow:"var(--shadow-md)",padding:"36px 28px",textAlign:"center" }}>
        <div style={{ width:60,height:60,borderRadius:999,background:"var(--success-soft)",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:20 }}>
          <CheckCircle size={30} style={{ color:"var(--success)" }} />
        </div>
        <div style={{ display:"inline-block",background:"var(--primary)",color:"white",borderRadius:999,padding:"3px 12px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12 }}>
          Winner Academia de Tênis
        </div>
        <h1 style={{ margin:"0 0 10px",fontSize:22 }}>Pagamento aprovado!</h1>
        <p style={{ margin:"0 0 24px",color:"var(--text-soft)",fontSize:14,lineHeight:1.5 }}>
          O Mercado Pago confirmou seu pagamento. A baixa será registrada automaticamente em instantes.
        </p>
        <a href="/agendar" style={{ display:"inline-block",padding:"10px 24px",background:"var(--primary)",color:"white",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none" }}>
          Agendar aula
        </a>
      </div>
    </main>
  );
}
