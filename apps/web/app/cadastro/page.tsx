"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { ErpShell } from "../components/erp-shell";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: "9px 12px",
  border: "1.5px solid var(--border)",
  borderRadius: 8,
  fontSize: 14,
  color: "var(--text)",
  background: "var(--surface)",
  outline: "none",
  width: "100%"
};

export default function CadastroPage() {
  const router = useRouter();
  const [name,         setName]         = useState("");
  const [cpf,          setCpf]          = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [city,         setCity]         = useState("");
  const [state,        setState2]       = useState("");
  const [createPortal, setCreatePortal] = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  const fmtCpf = (v: string) =>
    v.replace(/\D/g, "").slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

  const fmtPhone = (v: string) =>
    v.replace(/\D/g, "").slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/\((\d{2})\) (\d{5})(\d)/, "($1) $2-$3");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    try {
      const res = await fetch(`${API_URL}/demo/alunos/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          document: cpf.replace(/\D/g, ""),
          email:    email || undefined,
          phone:    phone || undefined,
          city:     city  || undefined,
          state:    state || undefined,
          createPortal
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erro ao cadastrar");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName(""); setCpf(""); setEmail(""); setPhone("");
    setCity(""); setState2(""); setSuccess(false); setError("");
  }

  // Não usa ErpShell pois precisamos do companyName — usamos wrapper manual
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserPlus size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)" }}>Winner Academia</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Cadastrar aluno</h1>
          </div>
          <button onClick={() => router.push("/alunos")} style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-soft)", background: "none", border: "none", cursor: "pointer", padding: "6px 10px" }}>
            ← Voltar
          </button>
        </div>

        {/* Sucesso */}
        {success ? (
          <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", padding: "32px 28px", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--primary-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <CheckCircle size={26} style={{ color: "var(--primary)" }} />
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Aluno cadastrado!</h2>
            <p style={{ margin: "0 0 24px", color: "var(--text-soft)", fontSize: 14 }}>
              {createPortal
                ? "O aluno já pode acessar o portal em /cliente usando o CPF e criando uma senha no primeiro acesso."
                : "Aluno cadastrado sem acesso ao portal. Você pode ativar depois na página de Alunos."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={resetForm} style={{ padding: "9px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                Cadastrar outro
              </button>
              <button onClick={() => router.push("/alunos")} style={{ padding: "9px 20px", background: "var(--surface-soft)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                Ver alunos
              </button>
            </div>
          </div>
        ) : (

        /* Formulário */
        <form onSubmit={handleSubmit} style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", padding: "24px 28px", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Nome + CPF */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Nome completo *">
              <input style={inp} type="text" placeholder="Ana Paula Ferreira" value={name}
                onChange={e => setName(e.target.value)} required maxLength={120} />
            </Field>
            <Field label="CPF *">
              <input style={inp} type="text" placeholder="000.000.000-00" value={cpf}
                onChange={e => setCpf(fmtCpf(e.target.value))} required maxLength={14} />
            </Field>
          </div>

          {/* Email + Telefone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="E-mail">
              <input style={inp} type="email" placeholder="aluno@email.com" value={email}
                onChange={e => setEmail(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Telefone / WhatsApp">
              <input style={inp} type="text" placeholder="(11) 99999-9999" value={phone}
                onChange={e => setPhone(fmtPhone(e.target.value))} maxLength={15} />
            </Field>
          </div>

          {/* Cidade + Estado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14 }}>
            <Field label="Cidade">
              <input style={inp} type="text" placeholder="São Paulo" value={city}
                onChange={e => setCity(e.target.value)} maxLength={60} />
            </Field>
            <Field label="Estado">
              <select style={{ ...inp, width: 80 }} value={state} onChange={e => setState2(e.target.value)}>
                <option value="">UF</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Acesso ao portal */}
          <div style={{ padding: "12px 14px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={createPortal} onChange={e => setCreatePortal(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Ativar portal do aluno</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                  O aluno poderá acessar <strong>/cliente</strong> com o CPF para ver e pagar cobranças
                </div>
              </div>
            </label>
          </div>

          {/* Erro */}
          {error && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "var(--danger-soft)", borderRadius: 8, fontSize: 13, color: "var(--danger)" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{ padding: "11px", background: loading ? "var(--surface-soft)" : "var(--primary)", color: loading ? "var(--text-soft)" : "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: loading ? "none" : "0 2px 8px rgba(31,175,26,0.3)" }}>
            <UserPlus size={15} />
            {loading ? "Cadastrando..." : "Cadastrar aluno"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
