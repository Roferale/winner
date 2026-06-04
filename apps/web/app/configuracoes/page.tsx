"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, CreditCard, Key, ShieldCheck, Trash2, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff, X, ScrollText, RefreshCw } from "lucide-react";
import { ErpShell } from "../components/erp-shell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
type Toast = { msg: string; ok: boolean } | null;

function useToast(): [Toast, (msg: string, ok?: boolean) => void] {
  const [t, setT] = useState<Toast>(null);
  const show = (msg: string, ok = true) => { setT({ msg, ok }); setTimeout(() => setT(null), 3500); };
  return [t, show];
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)",
  borderRadius: 8, fontSize: 14, color: "var(--text)", background: "var(--surface)", outline: "none"
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-soft)",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5
};
const card: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14
};

function SaveBtn({ loading, label = "Salvar" }: { loading: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading}
      style={{ alignSelf: "flex-start", padding: "9px 20px", background: loading ? "var(--surface-soft)" : "var(--primary)", color: loading ? "var(--text-soft)" : "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 2px 8px rgba(31,175,26,0.3)" }}>
      {loading ? "Salvando..." : label}
    </button>
  );
}

/* ─── Tab: Empresa ─────────────────────────────────────────────────────────── */
function TabEmpresa({ data, toast }: { data: any; toast: (m: string, ok?: boolean) => void }) {
  const [tradeName, setTradeName] = useState(data?.company?.tradeName ?? "");
  const [address,   setAddress]   = useState(data?.company?.address ?? "");
  const [phone,     setPhone]     = useState(data?.company?.phone ?? "");
  const [email,     setEmail]     = useState(data?.company?.email ?? "");
  const [loading,   setLoading]   = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const r = await fetch(`${API}/settings/demo/company`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tradeName, address, phone, email }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast("Dados da empresa atualizados!");
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={save} style={card}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={lbl}>Nome comercial</label>
          <input style={inp} value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="Winner Academia" />
        </div>
        <div>
          <label style={lbl}>CNPJ</label>
          <input style={{ ...inp, background: "var(--surface-soft)", color: "var(--text-faint)" }} value={data?.company?.cnpj ?? ""} readOnly />
        </div>
      </div>
      <div>
        <label style={lbl}>Endereço</label>
        <input style={inp} value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua das Quadras, 100 — São Paulo/SP" maxLength={200} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={lbl}>Telefone</label>
          <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" maxLength={20} />
        </div>
        <div>
          <label style={lbl}>E-mail</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@winner.com.br" maxLength={80} />
        </div>
      </div>
      <SaveBtn loading={loading} />
    </form>
  );
}

/* ─── Tab: Pagamentos ──────────────────────────────────────────────────────── */
function TabPagamentos({ data, toast }: { data: any; toast: (m: string, ok?: boolean) => void }) {
  const savedKey     = data?.pix?.pixKey ?? "";
  const savedType    = data?.pix?.pixKeyType ?? "EMAIL";

  const [pixKey,     setPixKey]     = useState(savedKey);
  const [pixType,    setPixType]    = useState(savedType);
  const [editing,    setEditing]    = useState(!savedKey);
  const [confirmDel, setConfirmDel] = useState(false);
  const [mpToken,    setMpToken]    = useState("");
  const [psToken,    setPsToken]    = useState("");
  const [psEnv,      setPsEnv]      = useState(data?.gateways?.pagseguro?.env ?? "sandbox");
  const [showMp,     setShowMp]     = useState(false);
  const [showPs,     setShowPs]     = useState(false);
  const [loading,    setLoading]    = useState(false);

  const PIX_LABELS: Record<string, string> = {
    EMAIL: "E-mail", CNPJ: "CNPJ", CPF: "CPF", PHONE: "Telefone", RANDOM: "Chave aleatória"
  };

  async function savePix(e: React.FormEvent) {
    e.preventDefault(); if (!pixKey) return; setLoading(true);
    try {
      const r = await fetch(`${API}/settings/demo/pix`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pixKey, pixKeyType: pixType }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast("Chave PIX atualizada!");
      setEditing(false);
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
    finally { setLoading(false); }
  }

  async function deletePix() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/settings/demo/pix`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setPixKey(""); setPixType("EMAIL"); setEditing(true); setConfirmDel(false);
      toast("Chave PIX removida.");
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
    finally { setLoading(false); }
  }

  async function saveGateways(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const r = await fetch(`${API}/settings/demo/gateways`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mpToken: mpToken || undefined, psToken: psToken || undefined, psEnv }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast("Credenciais salvas com criptografia AES-256!");
      setMpToken(""); setPsToken("");
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
    finally { setLoading(false); }
  }

  const mpStatus = data?.gateways?.mp?.configured;
  const psStatus = data?.gateways?.pagseguro?.configured;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* PIX */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Key size={15} style={{ color: "var(--primary)" }} /> Chave PIX
        </div>

        {/* Chave cadastrada — modo visualização */}
        {!editing && savedKey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "var(--surface-soft)", borderRadius: 9, border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  {PIX_LABELS[savedType] ?? savedType}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", fontFamily: "monospace" }}>
                  {savedKey}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setEditing(true)}
                  style={{ padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--text-soft)" }}>
                  Alterar
                </button>
                <button type="button" onClick={() => setConfirmDel(true)}
                  style={{ padding: "7px 14px", background: "var(--danger-soft)", border: "1px solid transparent", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--danger)" }}>
                  Excluir
                </button>
              </div>
            </div>

            {/* Confirmação de exclusão inline */}
            {confirmDel && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: "var(--danger-soft)", borderRadius: 9, border: "1px solid var(--danger)" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>
                  Remover a chave PIX? Os alunos não poderão mais pagar via PIX.
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button type="button" onClick={() => setConfirmDel(false)}
                    style={{ padding: "6px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--text-soft)" }}>
                    Cancelar
                  </button>
                  <button type="button" onClick={deletePix} disabled={loading}
                    style={{ padding: "6px 14px", background: "var(--danger)", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "white" }}>
                    {loading ? "Removendo..." : "Sim, remover"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sem chave cadastrada */}
        {!editing && !savedKey && (
          <div style={{ padding: "12px 14px", background: "var(--warning-soft)", borderRadius: 9, border: "1px solid var(--warning-soft)", fontSize: 13, color: "var(--warning)" }}>
            Nenhuma chave PIX cadastrada. Os alunos não poderão pagar via PIX.
          </div>
        )}

        {/* Formulário de edição */}
        {editing && (
          <form onSubmit={savePix} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Tipo</label>
                <select style={{ ...inp, width: 130 }} value={pixType} onChange={e => setPixType(e.target.value)}>
                  {Object.entries(PIX_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Chave</label>
                <input style={inp} value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="winner@academia.com.br" maxLength={80} autoFocus />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SaveBtn loading={loading} label="Salvar chave PIX" />
              {savedKey && (
                <button type="button" onClick={() => { setPixKey(savedKey); setPixType(savedType); setEditing(false); }}
                  style={{ padding: "9px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--text-soft)" }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Gateways */}
      <form onSubmit={saveGateways} style={card}>
        <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={15} style={{ color: "var(--primary)" }} /> Gateways de pagamento
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)" }}>
          Credenciais armazenadas com criptografia AES-256-GCM. Deixe em branco para manter o valor atual.
        </p>

        {/* MP */}
        <div style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>💙 Mercado Pago</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: mpStatus ? "var(--success)" : "var(--text-faint)" }}>
              {mpStatus ? `✓ Configurado (${data.gateways.mp.masked})` : "Não configurado"}
            </span>
          </div>
          <label style={lbl}>Access Token</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...inp, paddingRight: 36 }} type={showMp ? "text" : "password"} value={mpToken} onChange={e => setMpToken(e.target.value)} placeholder="APP_USR-..." />
            <button type="button" onClick={() => setShowMp(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)" }}>
              {showMp ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* PagSeguro */}
        <div style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>🟡 PagSeguro / PagBank</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: psStatus ? "var(--success)" : "var(--text-faint)" }}>
              {psStatus ? `✓ Configurado (${data.gateways.pagseguro.masked})` : "Não configurado"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
            <div>
              <label style={lbl}>Token</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...inp, paddingRight: 36 }} type={showPs ? "text" : "password"} value={psToken} onChange={e => setPsToken(e.target.value)} placeholder="token..." />
                <button type="button" onClick={() => setShowPs(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)" }}>
                  {showPs ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label style={lbl}>Ambiente</label>
              <select style={{ ...inp, width: 120 }} value={psEnv} onChange={e => setPsEnv(e.target.value)}>
                <option value="sandbox">Sandbox</option>
                <option value="production">Produção</option>
              </select>
            </div>
          </div>
        </div>

        <SaveBtn loading={loading} label="Salvar credenciais" />
      </form>
    </div>
  );
}

/* ─── Roles & permissions ────────────────────────────────────────────────────── */
const ROLE_META: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  OWNER:   { label: "Master",        desc: "Acesso total — configura tudo, gerencia usuários e gateways", color: "#7c3aed", bg: "#ede9fe" },
  ADMIN:   { label: "Administrador", desc: "Acesso operacional completo, sem configurações e usuários",    color: "var(--primary-dark)", bg: "var(--primary-soft)" },
  FINANCE: { label: "Financeiro",    desc: "Lançamentos e extrato. Não cadastra alunos nem configura",     color: "var(--success)",      bg: "var(--success-soft)"  },
  MANAGER: { label: "Recepcionista", desc: "Cadastra alunos e visualiza financeiro. Não cria lançamentos", color: "var(--warning)",      bg: "var(--warning-soft)"  },
};

const PERMISSIONS: Array<{ label: string; roles: string[] }> = [
  { label: "Dashboard",              roles: ["OWNER","ADMIN","FINANCE","MANAGER"] },
  { label: "Financeiro — visualizar",roles: ["OWNER","ADMIN","FINANCE","MANAGER"] },
  { label: "Financeiro — lançar",    roles: ["OWNER","ADMIN","FINANCE"] },
  { label: "Importar extrato",       roles: ["OWNER","ADMIN","FINANCE"] },
  { label: "Alunos — visualizar",    roles: ["OWNER","ADMIN","FINANCE","MANAGER"] },
  { label: "Alunos — cadastrar",     roles: ["OWNER","ADMIN","MANAGER"] },
  { label: "Configurações",          roles: ["OWNER"] },
  { label: "Gerenciar usuários",     roles: ["OWNER"] },
];

function PermChip({ allowed }: { allowed: boolean }) {
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:4,
      background: allowed ? "var(--success-soft)" : "var(--surface-soft)",
      color: allowed ? "var(--success)" : "var(--text-faint)"
    }}>
      {allowed ? <CheckCircle size={9}/> : <X size={9}/>}
      {allowed ? "Sim" : "Não"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role];
  if (!m) return <span>{role}</span>;
  return (
    <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:6,background:m.bg,color:m.color,whiteSpace:"nowrap" }}>
      {m.label}
    </span>
  );
}

function PermissionPreview({ role }: { role: string }) {
  return (
    <div style={{ padding:"10px 12px",background:"var(--surface-soft)",borderRadius:8,border:"1px solid var(--border)" }}>
      <div style={{ fontSize:12,fontWeight:700,color:"var(--text-soft)",marginBottom:8 }}>PERMISSÕES</div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr auto",rowGap:5 }}>
        {PERMISSIONS.map(p => (
          <>
            <span key={p.label+"l"} style={{ fontSize:12 }}>{p.label}</span>
            <PermChip key={p.label+"c"} allowed={p.roles.includes(role)} />
          </>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab: Usuários ─────────────────────────────────────────────────────────── */
function TabUsuarios({ data, toast, reload }: { data: any; toast: (m: string, ok?: boolean) => void; reload: () => void }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("ADMIN");
  const [loading,  setLoading]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);

  async function addUser(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const r = await fetch(`${API}/settings/demo/users`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name, email, password, role }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast("Usuário criado!"); setName(""); setEmail(""); setPassword(""); setShowAdd(false); reload();
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
    finally { setLoading(false); }
  }

  async function removeUser(id: string, userName: string) {
    if (!confirm(`Remover ${userName}?`)) return;
    try {
      const r = await fetch(`${API}/settings/demo/users/${id}`, { method:"DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast("Usuário removido!"); reload();
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
  }

  const masters = (data?.users ?? []).filter((u: any) => u.role === "OWNER");
  const staff   = (data?.users ?? []).filter((u: any) => u.role !== "OWNER");

  function UserRow({ u, showDelete }: { u: any; showDelete: boolean }) {
    return (
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--surface-soft)",borderRadius:8,border:"1px solid var(--border)" }}>
        <div style={{ width:32,height:32,borderRadius:999,background:ROLE_META[u.role]?.bg ?? "var(--surface-soft)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:ROLE_META[u.role]?.color ?? "var(--text-soft)",flexShrink:0 }}>
          {u.name.split(" ").slice(0,2).map((w: string) => w[0]).join("").toUpperCase()}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:13 }}>{u.name}</div>
          <div style={{ fontSize:12,color:"var(--text-soft)" }}>{u.email}</div>
        </div>
        <RoleBadge role={u.role} />
        {showDelete && (
          <button type="button" onClick={() => removeUser(u.id, u.name)} style={{ border:"none",background:"none",cursor:"pointer",color:"var(--danger)",padding:4,borderRadius:6 }} title="Remover">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

      {/* Administrador Master */}
      <div style={card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800,fontSize:14 }}>Administrador Master</div>
            <div style={{ fontSize:12,color:"var(--text-soft)",marginTop:2 }}>Acesso total — não pode ser removido</div>
          </div>
          <RoleBadge role="OWNER" />
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {masters.map((u: any) => <UserRow key={u.id} u={u} showDelete={false} />)}
        </div>
      </div>

      {/* Funcionários */}
      <div style={card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800,fontSize:14 }}>Funcionários</div>
            <div style={{ fontSize:12,color:"var(--text-soft)",marginTop:2 }}>Acesso limitado conforme o perfil atribuído</div>
          </div>
          <button type="button" onClick={() => setShowAdd(v => !v)}
            style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",background:"var(--primary)",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer" }}>
            <UserPlus size={13} /> Adicionar
          </button>
        </div>

        {staff.length === 0 && !showAdd && (
          <p style={{ margin:0,fontSize:13,color:"var(--text-faint)",textAlign:"center",padding:"12px 0" }}>
            Nenhum funcionário cadastrado.
          </p>
        )}
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {staff.map((u: any) => <UserRow key={u.id} u={u} showDelete={true} />)}
        </div>

        {/* Formulário inline */}
        {showAdd && (
          <form onSubmit={addUser} style={{ marginTop:8,display:"flex",flexDirection:"column",gap:12,padding:"14px",background:"var(--surface-accent)",borderRadius:10,border:"1px solid var(--border)" }}>
            <div style={{ fontWeight:700,fontSize:13 }}>Novo funcionário</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              <div><label style={lbl}>Nome</label><input style={inp} required value={name} onChange={e => setName(e.target.value)} placeholder="Maria Silva" /></div>
              <div><label style={lbl}>E-mail</label><input style={inp} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="maria@winner.com.br" /></div>
              <div><label style={lbl}>Senha</label><input style={inp} type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="mín. 6 caracteres" minLength={6} /></div>
              <div>
                <label style={lbl}>Perfil</label>
                <select style={inp} value={role} onChange={e => setRole(e.target.value)}>
                  {(["ADMIN","FINANCE","MANAGER"] as const).map(r => (
                    <option key={r} value={r}>{ROLE_META[r].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição + preview de permissões */}
            <div style={{ fontSize:12,color:"var(--text-soft)",padding:"6px 10px",background:"var(--surface)",borderRadius:6,border:"1px solid var(--border)" }}>
              {ROLE_META[role]?.desc}
            </div>
            <PermissionPreview role={role} />

            <div style={{ display:"flex",gap:8 }}>
              <SaveBtn loading={loading} label="Criar funcionário" />
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding:"9px 14px",background:"none",color:"var(--text-soft)",border:"1px solid var(--border)",borderRadius:8,fontSize:13,cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabela de permissões por perfil */}
      <div style={card}>
        <div style={{ fontWeight:800,fontSize:14,marginBottom:4 }}>Matriz de permissões</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left",padding:"6px 10px",color:"var(--text-soft)",fontWeight:700,borderBottom:"1px solid var(--border)" }}>Funcionalidade</th>
                {(["OWNER","ADMIN","FINANCE","MANAGER"] as const).map(r => (
                  <th key={r} style={{ padding:"6px 10px",borderBottom:"1px solid var(--border)" }}>
                    <RoleBadge role={r} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p, i) => (
                <tr key={p.label} style={{ background: i % 2 === 0 ? "transparent" : "var(--surface-muted)" }}>
                  <td style={{ padding:"7px 10px",fontWeight:500 }}>{p.label}</td>
                  {(["OWNER","ADMIN","FINANCE","MANAGER"] as const).map(r => (
                    <td key={r} style={{ padding:"7px 10px",textAlign:"center" }}>
                      <PermChip allowed={p.roles.includes(r)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Logs ─────────────────────────────────────────────────────────────── */
const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  PAGAMENTO_REALIZADO: { label: "Pagamento recebido",   color: "var(--success)",      bg: "var(--success-soft)"  },
  EXTRATO_IMPORTADO:   { label: "Extrato importado",    color: "var(--primary-dark)", bg: "var(--primary-soft)"  },
  LANCAMENTO_CRIADO:   { label: "Lançamento criado",    color: "var(--primary-dark)", bg: "var(--primary-soft)"  },
  ALUNO_CADASTRADO:    { label: "Aluno cadastrado",     color: "#7c3aed",             bg: "#ede9fe"              },
  LOGIN_ALUNO:         { label: "Login do aluno",       color: "#7c3aed",             bg: "#ede9fe"              },
  AULA_AGENDADA:       { label: "Aula agendada",        color: "#7c3aed",             bg: "#ede9fe"              },
  USUARIO_CRIADO:      { label: "Usuário criado",       color: "var(--warning)",      bg: "var(--warning-soft)"  },
  USUARIO_REMOVIDO:    { label: "Usuário removido",     color: "var(--danger)",       bg: "var(--danger-soft)"   },
  SENHA_ALTERADA:      { label: "Senha alterada",       color: "var(--warning)",      bg: "var(--warning-soft)"  },
  CONFIG_EMPRESA:      { label: "Empresa atualizada",   color: "#0369a1",             bg: "#e0f2fe"              },
  CONFIG_PIX:          { label: "Chave PIX alterada",   color: "#0369a1",             bg: "#e0f2fe"              },
  CONFIG_GATEWAYS:     { label: "Gateways atualizados", color: "#0369a1",             bg: "#e0f2fe"              },
};

const CAT_LABELS: Record<string, string> = {
  "": "Todos", pagamentos: "Pagamentos", alunos: "Alunos", usuarios: "Usuários", config: "Configurações"
};

function describeEvent(action: string, p: any): string {
  switch (action) {
    case "PAGAMENTO_REALIZADO": return `${p.descricao ?? "Cobrança"} · ${p.valor} via ${p.metodo} · Recibo ${p.recibo}`;
    case "EXTRATO_IMPORTADO":   return `${p.arquivo}: ${p.criados} lançamentos criados, ${p.ignorados} ignorados`;
    case "LANCAMENTO_CRIADO":   return `${p.descricao} · ${p.valor} · ${p.direcao} · Venc. ${p.vencimento}`;
    case "ALUNO_CADASTRADO":    return `${p.nome} · CPF ${p.cpf} · ${p.cidade} · Portal: ${p.portal}`;
    case "LOGIN_ALUNO":         return `${p.aluno} (${p.cpf}) acessou o portal`;
    case "AULA_AGENDADA":       return `${p.aluno} agendou ${p.turma} em ${p.data}`;
    case "USUARIO_CRIADO":      return `${p.nome} · ${p.email} · Perfil: ${p.perfil}`;
    case "USUARIO_REMOVIDO":    return `${p.nome} · ${p.email} · Perfil: ${p.perfil}`;
    case "SENHA_ALTERADA":      return `Senha alterada para ${p.email}`;
    case "CONFIG_PIX":          return `Chave: ${p.de?.chave ?? "?"} → ${p.para?.chave} (${p.para?.tipo})`;
    case "CONFIG_EMPRESA":      return p.de?.nome !== p.para?.nome ? `Nome: "${p.de?.nome}" → "${p.para?.nome}"` : `Endereço: ${p.para?.endereco}`;
    case "CONFIG_GATEWAYS":     return `Gateways: ${p.gateways_atualizados} · Ambiente: ${p.ambiente_pagseguro}`;
    default: return action;
  }
}

function formatObj(obj: unknown): string {
  if (!obj || typeof obj !== "object") return String(obj ?? "—");
  return Object.entries(obj as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

function DiffRow({ before, after }: { before: unknown; after: unknown }) {
  if (!before && !after) return null;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap" }}>
      {before && (
        <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:"var(--danger-soft)",color:"var(--danger)",textDecoration:"line-through" }}>
          {formatObj(before)}
        </span>
      )}
      <span style={{ fontSize:11,color:"var(--text-faint)" }}>→</span>
      {after && (
        <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,background:"var(--success-soft)",color:"var(--success)" }}>
          {formatObj(after)}
        </span>
      )}
    </div>
  );
}

function LogRow({ log, isLast }: { log: any; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const meta    = ACTION_META[log.action];
  const p       = (typeof log.payload === "object" && log.payload) ? log.payload as Record<string, unknown> : {};
  const hasDiff = Boolean(p.de || p.para);
  const usuario = (p.usuario ?? p.aluno ?? p.email ?? "sistema") as string;
  const desc    = describeEvent(log.action, p);
  const fmtDate = (d: string) => new Date(d).toLocaleString("pt-BR", { day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit" });

  const details = Object.entries(p).filter(([k]) => !["de","para","usuario","ip"].includes(k));

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
      {/* Cabeçalho clicável */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpen(v => !v)}
        style={{ width:"100%",textAlign:"left",padding:"11px 14px",background:"none",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:12 }}
      >
        <div style={{ width:8,height:8,borderRadius:999,background:meta?.color ?? "var(--text-faint)",marginTop:5,flexShrink:0 }} />
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
            <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:5,background:meta?.bg ?? "var(--surface-soft)",color:meta?.color ?? "var(--text-faint)",whiteSpace:"nowrap" }}>
              {meta?.label ?? log.action}
            </span>
            {!desc.includes("undefined") && (
              <span style={{ fontSize:13,color:"var(--text)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:420 }}>
                {desc}
              </span>
            )}
          </div>
          {hasDiff && <DiffRow before={p.de} after={p.para} />}
          <div style={{ display:"flex",gap:12,fontSize:11,color:"var(--text-faint)" }}>
            <span>👤 {usuario}</span>
            <span>🕐 {fmtDate(log.createdAt)}</span>
            <span>ID {String(log.entityId ?? "").slice(0,10)}...</span>
          </div>
        </div>
        <span style={{ fontSize:10,color:"var(--text-faint)",flexShrink:0,marginTop:3,userSelect:"none" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* Detalhes expandidos */}
      {open && (
        <div style={{ padding:"0 14px 12px 34px" }}>
          {details.length > 0 ? (
            <div style={{ display:"grid",gridTemplateColumns:"min-content 1fr",columnGap:16,rowGap:5,padding:"10px 12px",background:"var(--surface-soft)",borderRadius:8,border:"1px solid var(--border)" }}>
              {details.map(([k, v]) => [
                <span key={k+"-k"} style={{ fontSize:11,fontWeight:700,color:"var(--text-soft)",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap" }}>{k}</span>,
                <span key={k+"-v"} style={{ fontSize:12,color:"var(--text)" }}>{typeof v === "object" ? formatObj(v) : String(v ?? "—")}</span>
              ])}
            </div>
          ) : (
            <p style={{ margin:0,fontSize:12,color:"var(--text-faint)" }}>Sem detalhes adicionais.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabLogs() {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [cat,     setCat]     = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API}/settings/demo/logs?limit=200${cat ? `&category=${cat}` : ""}`;
      const r   = await fetch(url);
      const j   = await r.json();
      setLogs(j.logs ?? []); setTotal(j.total ?? 0);
    } finally { setLoading(false); }
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {/* Header + filtros */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
        <div>
          <div style={{ fontWeight:800,fontSize:14 }}>Log de eventos do sistema</div>
          <div style={{ fontSize:12,color:"var(--text-soft)" }}>{total} evento{total !== 1 ? "s" : ""} · clique em um item para ver detalhes</div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <select value={cat} onChange={e => setCat(e.target.value)}
            style={{ padding:"6px 10px",border:"1px solid var(--border)",borderRadius:7,fontSize:12,background:"var(--surface)",color:"var(--text)",outline:"none" }}>
            {Object.entries(CAT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="button" onClick={load} disabled={loading}
            style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",border:"1px solid var(--border)",borderRadius:7,background:"var(--surface)",fontSize:12,cursor:"pointer",color:"var(--text-soft)" }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 0.9s linear infinite" : "none" }} /> Atualizar
          </button>
        </div>
      </div>

      {loading && <p style={{ textAlign:"center",color:"var(--text-faint)",padding:24 }}>Carregando...</p>}
      {!loading && logs.length === 0 && (
        <div style={{ textAlign:"center",padding:"40px 20px",color:"var(--text-faint)" }}>
          <ScrollText size={32} style={{ marginBottom:10,opacity:0.4 }} />
          <p style={{ margin:0,fontWeight:600 }}>Nenhum evento registrado ainda.</p>
          <p style={{ margin:"4px 0 0",fontSize:12 }}>Os eventos aparecem aqui conforme o sistema é usado.</p>
        </div>
      )}
      {!loading && logs.length > 0 && (
        <div style={{ border:"1px solid var(--border)",borderRadius:10,overflow:"hidden",background:"var(--surface)" }}>
          {logs.map((log, i) => <LogRow key={log.id} log={log} isLast={i === logs.length - 1} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Segurança ────────────────────────────────────────────────────────── */
function TabSeguranca({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [email,    setEmail]    = useState("admin@erp.local");
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast("As senhas não coincidem.", false); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/settings/demo/password`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, currentPassword: current, newPassword: next }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      toast("Senha alterada com sucesso!"); setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Erro", false); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={save} style={card}>
      <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <ShieldCheck size={15} style={{ color: "var(--primary)" }} /> Alterar senha do administrador
      </div>
      <div>
        <label style={lbl}>E-mail do usuário</label>
        <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@erp.local" required />
      </div>
      <div>
        <label style={lbl}>Senha atual</label>
        <input style={inp} type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Nova senha</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...inp, paddingRight: 36 }} type={showPw ? "text" : "password"} value={next} onChange={e => setNext(e.target.value)} placeholder="mín. 6 caracteres" minLength={6} required />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--text-faint)" }}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label style={lbl}>Confirmar nova senha</label>
          <input style={inp} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="repita a senha" required />
        </div>
      </div>
      <SaveBtn loading={loading} label="Alterar senha" />
    </form>
  );
}

/* ─── Página principal ──────────────────────────────────────────────────────── */
const TABS = [
  { id: "empresa",    label: "Empresa",    icon: Building2   },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard  },
  { id: "usuarios",   label: "Usuários",   icon: UserPlus    },
  { id: "seguranca",  label: "Segurança",  icon: ShieldCheck },
  { id: "logs",       label: "Logs",       icon: ScrollText  }
] as const;

export default function ConfiguracoesPage() {
  const [tab,     setTab]     = useState<typeof TABS[number]["id"]>("empresa");
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast,   showToast]  = useToast();

  async function load() {
    try {
      const r = await fetch(`${API}/settings/demo`);
      setData(await r.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const companyName = data?.company?.tradeName ?? "Winner Academia";
  const companyCnpj = data?.company?.cnpj       ?? "";

  return (
    <ErpShell currentPath="/configuracoes" companyName={companyName} companyCnpj={companyCnpj}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 10, background: toast.ok ? "var(--success-soft)" : "var(--danger-soft)", color: toast.ok ? "var(--success)" : "var(--danger)", border: `1px solid ${toast.ok ? "var(--success)" : "var(--danger)"}`, boxShadow: "var(--shadow-md)", fontSize: 14, fontWeight: 600 }}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Card único: header + tabs + conteúdo */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>

        {/* Header integrado */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
          <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 3 }}>Sistema</div>
          <h2 style={{ margin: "2px 0 3px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Configurações</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)" }}>Empresa, pagamentos, usuários e segurança</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", background: "var(--surface)" }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", border: "none", background: "none", borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent", color: active ? "var(--primary)" : "var(--text-soft)", fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "color 0.15s", marginBottom: -1, whiteSpace: "nowrap" }}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div style={{ padding: 24, maxWidth: 720 }}>
          {loading ? (
            <p style={{ color: "var(--text-soft)", textAlign: "center", padding: 40, margin: 0 }}>Carregando...</p>
          ) : (
            <>
              {tab === "empresa"    && <TabEmpresa     data={data} toast={showToast} />}
              {tab === "pagamentos" && <TabPagamentos  data={data} toast={showToast} />}
              {tab === "usuarios"   && <TabUsuarios    data={data} toast={showToast} reload={load} />}
              {tab === "seguranca"  && <TabSeguranca   toast={showToast} />}
              {tab === "logs"       && <TabLogs />}
            </>
          )}
        </div>
      </div>
    </ErpShell>
  );
}
