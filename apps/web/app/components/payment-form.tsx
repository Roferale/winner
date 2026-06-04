"use client";

import { useState } from "react";
import { CheckCircle, Copy, Check, Smartphone, CreditCard, FileText, ShieldCheck, ExternalLink } from "lucide-react";

type Method = "PIX" | "CREDIT_CARD" | "BOLETO";

const fmt = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }); }}
      style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",border:"1px solid var(--border)",borderRadius:6,background:"var(--surface)",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--text)" }}>
      {done ? <><Check size={13}/>Copiado!</> : <><Copy size={13}/>Copiar</>}
    </button>
  );
}

function TabBtn({ active, onClick, icon, label }: { active:boolean;onClick:()=>void;icon:React.ReactNode;label:string }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
      padding:"10px 8px",border:"none",
      borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
      background:"none",fontWeight:active?700:500,fontSize:13,
      color:active?"var(--primary)":"var(--text-soft)",cursor:"pointer"
    }}>
      {icon}{label}
    </button>
  );
}

export function PaymentForm({ entry, apiUrl }: { entry: any; apiUrl: string }) {
  const [method, setMethod]   = useState<Method>("PIX");
  const [state, setState]     = useState<"idle"|"loading"|"success">("idle");
  const [receipt, setReceipt] = useState<any>(null);
  const [errorMsg, setError]  = useState("");
  const [mpLoading, setMpLoad] = useState(false);

  const amount   = Number(entry.amount);
  const pixKey   = entry.pixKey ?? "winner@academia.com.br";
  const boletoCode = `34191.09008 12345.678901 23456.789012 3 ${String(Math.round(amount * 100)).padStart(14,"0")}`;
  const qrData   = encodeURIComponent(`PIX:${pixKey}|${fmt(amount)}|${entry.description}`);
  const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=178014`;

  async function payNative() {
    setState("loading"); setError("");
    try {
      const res = await fetch(`${apiUrl}/payment/${entry.id}/pay`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ method, paymentToken: entry.paymentToken })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erro ao processar pagamento");
      setReceipt(json); setState("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setState("idle");
    }
  }

  async function payCard() {
    setMpLoad(true); setError("");
    try {
      const res = await fetch(`${apiUrl}/payment/${entry.id}/mp-checkout`, {
        method:"POST", headers:{"Content-Type":"application/json"}
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erro ao abrir checkout");
      // Em produção usa init_point; em sandbox usa sandbox_init_point
      const url = json.sandboxCheckoutUrl ?? json.checkoutUrl;
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao redirecionar para o Mercado Pago");
      setMpLoad(false);
    }
  }

  if (state === "success" && receipt) {
    return (
      <div style={{ textAlign:"center",padding:"8px 0" }}>
        <div style={{ width:56,height:56,borderRadius:999,background:"var(--success-soft)",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
          <CheckCircle size={28} style={{ color:"var(--success)" }} />
        </div>
        <h2 style={{ margin:"0 0 6px",fontSize:20 }}>Pagamento confirmado!</h2>
        <p style={{ margin:"0 0 20px",color:"var(--text-soft)",fontSize:14 }}>Baixa registrada automaticamente no sistema.</p>
        <div style={{ background:"var(--surface-soft)",borderRadius:10,padding:16,textAlign:"left",fontSize:13,display:"grid",gap:8 }}>
          <div><strong>Recibo:</strong> {receipt.receiptId}</div>
          <div><strong>Descrição:</strong> {receipt.description}</div>
          <div><strong>Valor:</strong> {fmt(receipt.amount)}</div>
          <div><strong>Método:</strong> {receipt.method}</div>
          <div><strong>Data:</strong> {new Date(receipt.paidAt).toLocaleString("pt-BR")}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:"1px solid var(--border)",marginBottom:20 }}>
        <TabBtn active={method==="PIX"}         onClick={()=>setMethod("PIX")}         icon={<Smartphone size={14}/>}  label="PIX" />
        <TabBtn active={method==="CREDIT_CARD"} onClick={()=>setMethod("CREDIT_CARD")} icon={<CreditCard size={14}/>}  label="Cartão" />
        <TabBtn active={method==="BOLETO"}      onClick={()=>setMethod("BOLETO")}      icon={<FileText size={14}/>}    label="Boleto" />
      </div>

      {/* PIX */}
      {method === "PIX" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR Code PIX" width={180} height={180} style={{ borderRadius:12,border:"1px solid var(--border)" }} />
          <div>
            <p style={{ margin:"0 0 8px",fontSize:13,color:"var(--text-soft)" }}>Ou copie a chave PIX:</p>
            <div style={{ display:"flex",alignItems:"center",gap:8,justifyContent:"center" }}>
              <code style={{ background:"var(--surface-soft)",padding:"6px 12px",borderRadius:6,fontSize:13 }}>{pixKey}</code>
              <CopyBtn text={pixKey} />
            </div>
          </div>
          <p style={{ margin:0,fontSize:12,color:"var(--text-faint)" }}>Use o app do seu banco para pagar via PIX</p>
          <button type="button" onClick={payNative} disabled={state==="loading"}
            style={{ width:"100%",padding:"13px",background:state==="loading"?"var(--surface-soft)":"var(--primary)",color:state==="loading"?"var(--text-soft)":"white",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:state==="loading"?"not-allowed":"pointer" }}>
            {state==="loading" ? "Confirmando..." : `Confirmar pagamento PIX · ${fmt(amount)}`}
          </button>
        </div>
      )}

      {/* CARTÃO — PCI DSS: redirecionado para Mercado Pago */}
      {method === "CREDIT_CARD" && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {/* Aviso PCI */}
          <div style={{ display:"flex",gap:10,padding:"12px 14px",background:"var(--surface-soft)",borderRadius:10,border:"1px solid var(--border)" }}>
            <ShieldCheck size={18} style={{ color:"var(--success)",flexShrink:0,marginTop:1 }} />
            <div style={{ fontSize:12,color:"var(--text-soft)",lineHeight:1.5 }}>
              <strong style={{ color:"var(--text)" }}>PCI DSS certificado</strong><br/>
              Os dados do cartão são digitados e processados diretamente no Mercado Pago,
              servidor certificado <strong>PCI DSS Level 1</strong>. Nunca passam pelos nossos servidores.
            </div>
          </div>

          {/* Logo MP */}
          <div style={{ textAlign:"center",padding:"20px 0 8px" }}>
            <div style={{ fontSize:14,color:"var(--text-soft)",marginBottom:4 }}>Você será redirecionado para</div>
            <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"8px 20px",border:"1px solid var(--border)",borderRadius:10,background:"var(--surface)" }}>
              <span style={{ fontSize:20 }}>💙</span>
              <span style={{ fontWeight:800,fontSize:16,color:"#009EE3" }}>Mercado Pago</span>
            </div>
            <div style={{ marginTop:8,fontSize:11,color:"var(--text-faint)" }}>
              Aceita Visa, Mastercard, Elo, Hipercard e mais · Parcelamento disponível
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding:"10px 14px",background:"var(--danger-soft)",borderRadius:8,fontSize:13,color:"var(--danger)" }}>
              {errorMsg}
              {errorMsg.includes("MP_ACCESS_TOKEN") && (
                <><br/><span style={{ fontSize:11 }}>Configure a variável <code>MP_ACCESS_TOKEN</code> no arquivo <code>.env</code> da API.</span></>
              )}
            </div>
          )}

          <button type="button" onClick={payCard} disabled={mpLoading}
            style={{ width:"100%",padding:"13px",background:mpLoading?"#cce9f7":"#009EE3",color:"white",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:mpLoading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            {mpLoading ? "Abrindo checkout..." : <><ExternalLink size={16}/>Pagar {fmt(amount)} com Cartão</>}
          </button>
        </div>
      )}

      {/* BOLETO */}
      {method === "BOLETO" && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ background:"var(--surface-soft)",borderRadius:10,padding:16 }}>
            <p style={{ margin:"0 0 10px",fontSize:12,color:"var(--text-soft)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>Linha digitável</p>
            <code style={{ fontSize:13,wordBreak:"break-all",letterSpacing:"0.04em" }}>{boletoCode}</code>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <CopyBtn text={boletoCode} />
          </div>
          <p style={{ margin:0,fontSize:12,color:"var(--text-faint)",textAlign:"center" }}>Pague em qualquer banco, lotérica ou internet banking</p>
          <button type="button" onClick={payNative} disabled={state==="loading"}
            style={{ width:"100%",padding:"13px",background:state==="loading"?"var(--surface-soft)":"var(--primary)",color:state==="loading"?"var(--text-soft)":"white",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:state==="loading"?"not-allowed":"pointer" }}>
            {state==="loading" ? "Confirmando..." : `Confirmar pagamento Boleto · ${fmt(amount)}`}
          </button>
        </div>
      )}

      {/* Erros gerais */}
      {errorMsg && method !== "CREDIT_CARD" && (
        <div style={{ marginTop:14,padding:"10px 14px",background:"var(--danger-soft)",borderRadius:8,fontSize:13,color:"var(--danger)" }}>
          {errorMsg}
        </div>
      )}

      <p style={{ margin:"16px 0 0",textAlign:"center",fontSize:11,color:"var(--text-faint)",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}>
        <ShieldCheck size={12}/> Ambiente seguro · Winner Academia de Tênis
      </p>
    </div>
  );
}
