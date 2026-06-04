"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

type Step = "cpf" | "password" | "setup";

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 13px", border: "1.5px solid var(--border)",
  borderRadius: 8, fontSize: 15, color: "var(--text)", background: "var(--surface)", outline: "none"
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginBottom: 5
};

export function ClienteLoginForm({ apiUrl }: { apiUrl: string }) {
  const [step, setStep]           = useState<Step>("cpf");
  const [cpf, setCpf]             = useState("");
  const [personName, setName]     = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const router                    = useRouter();

  const formatCpf = (v: string) =>
    v.replace(/\D/g, "").slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

  async function checkCpf() {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${apiUrl}/cliente/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: cpf.replace(/\D/g, "") })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      if (json.firstAccess) { setName(json.personName ?? ""); setStep("setup"); }
      else                  { setName(json.personName ?? ""); setStep("password"); }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  async function doLogin() {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${apiUrl}/cliente/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: cpf.replace(/\D/g, ""), password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      sessionStorage.setItem("cliente_token", json.token);
      sessionStorage.setItem("cliente_name", json.personName);
      router.push("/cliente/cobrancas");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  async function setupPassword() {
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6)  { setError("Senha deve ter no mínimo 6 caracteres."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${apiUrl}/cliente/setup-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: cpf.replace(/\D/g, ""), password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      sessionStorage.setItem("cliente_token", json.token);
      sessionStorage.setItem("cliente_name", json.personName);
      router.push("/cliente/cobrancas");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  const btn: React.CSSProperties = {
    width: "100%", padding: "12px", background: loading ? "var(--surface-soft)" : "var(--primary)",
    color: loading ? "var(--text-soft)" : "white", border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 8
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Step: CPF */}
      {step === "cpf" && (
        <>
          <div>
            <label style={lbl}>Seu CPF</label>
            <input style={inp} type="text" placeholder="000.000.000-00" value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))} maxLength={14}
              onKeyDown={e => e.key === "Enter" && cpf.replace(/\D/g,"").length === 11 && checkCpf()} />
          </div>
          {error && <div style={{ display:"flex",gap:8,padding:"10px 12px",background:"var(--danger-soft)",borderRadius:8,fontSize:13,color:"var(--danger)" }}><AlertCircle size={15}/>{error}</div>}
          <button style={btn} onClick={checkCpf} disabled={loading || cpf.replace(/\D/g,"").length < 11}>
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </>
      )}

      {/* Step: senha */}
      {step === "password" && (
        <>
          <div style={{ padding:"10px 12px",background:"var(--surface-soft)",borderRadius:8,fontSize:13,color:"var(--text-soft)" }}>
            Olá, <strong style={{ color:"var(--text)" }}>{personName}</strong>! Informe sua senha.
          </div>
          <div>
            <label style={lbl}>Senha</label>
            <div style={{ position:"relative" }}>
              <input style={{ ...inp, paddingRight:40 }} type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && doLogin()} />
              <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer",color:"var(--text-faint)" }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          {error && <div style={{ display:"flex",gap:8,padding:"10px 12px",background:"var(--danger-soft)",borderRadius:8,fontSize:13,color:"var(--danger)" }}><AlertCircle size={15}/>{error}</div>}
          <button style={btn} onClick={doLogin} disabled={loading || !password}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <button style={{ ...btn, background:"none",color:"var(--text-soft)",marginTop:0 }} onClick={() => { setStep("cpf"); setPassword(""); setError(""); }}>
            Usar outro CPF
          </button>
        </>
      )}

      {/* Step: primeiro acesso — criar senha */}
      {step === "setup" && (
        <>
          <div style={{ padding:"10px 12px",background:"var(--primary-soft)",borderRadius:8,fontSize:13,color:"var(--primary-dark)" }}>
            Olá, <strong>{personName}</strong>! Este é seu primeiro acesso. Crie uma senha para continuar.
          </div>
          <div>
            <label style={lbl}>Criar senha (mín. 6 caracteres)</label>
            <div style={{ position:"relative" }}>
              <input style={{ ...inp, paddingRight:40 }} type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer",color:"var(--text-faint)" }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div>
            <label style={lbl}>Confirmar senha</label>
            <input style={inp} type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setupPassword()} />
          </div>
          {error && <div style={{ display:"flex",gap:8,padding:"10px 12px",background:"var(--danger-soft)",borderRadius:8,fontSize:13,color:"var(--danger)" }}><AlertCircle size={15}/>{error}</div>}
          <button style={btn} onClick={setupPassword} disabled={loading || !password || !confirm}>
            {loading ? "Salvando..." : "Criar senha e entrar"}
          </button>
        </>
      )}
    </div>
  );
}
