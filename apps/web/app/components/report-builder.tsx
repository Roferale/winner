"use client";

import { useEffect, useRef, useState } from "react";
import {
  GripVertical, Printer, Trash2, Plus, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, AlertTriangle, Wallet,
  Users, Clock, CheckCircle, FileText
} from "lucide-react";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
type BlockType =
  | "header" | "summary" | "receivables" | "payables"
  | "aging_receivable" | "aging_payable" | "alunos"
  | "settled" | "notes";

interface Block { id: string; type: BlockType; notes?: string }

interface Palette {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PALETTE: Palette[] = [
  { type: "header",          label: "Cabeçalho",             description: "Nome da empresa, data e título do relatório",       icon: <FileText size={15}/>          },
  { type: "summary",         label: "Resumo Financeiro",      description: "A Receber, A Pagar, Em Atraso e Saldo Líquido",     icon: <Wallet size={15}/>            },
  { type: "receivables",     label: "Títulos a Receber",      description: "Tabela de cobranças abertas",                      icon: <TrendingUp size={15}/>        },
  { type: "payables",        label: "Títulos a Pagar",        description: "Tabela de contas em aberto",                       icon: <TrendingDown size={15}/>      },
  { type: "aging_receivable",label: "Vencimentos a Receber",  description: "Distribuição por prazo de vencimento",             icon: <Clock size={15}/>             },
  { type: "aging_payable",   label: "Vencimentos a Pagar",    description: "Distribuição por prazo de pagamentos",             icon: <Clock size={15}/>             },
  { type: "settled",         label: "Títulos Pagos",          description: "Histórico de cobranças quitadas",                  icon: <CheckCircle size={15}/>       },
  { type: "alunos",          label: "Lista de Alunos",        description: "Cadastro com status do portal de cada aluno",      icon: <Users size={15}/>             },
  { type: "notes",           label: "Observações",            description: "Campo de texto livre para anotações",              icon: <FileText size={15}/>          },
];

function uid() { return Math.random().toString(36).slice(2, 8); }

/* ─── Renderização dos blocos no canvas ─────────────────────────────────── */
/* Formata CPF/CNPJ independente do tamanho */
function fmtDoc(doc?: string) {
  if (!doc) return "—";
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

/* Título de seção para separar blocos no PDF */
function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ padding: "10px 16px 8px", borderBottom: "2px solid #d0e4d0", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: "#18a813", flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3d5c3d" }}>{label}</span>
    </div>
  );
}

function BlockContent({ block, data }: { block: Block; data: any }) {
  const th: React.CSSProperties = {
    padding: "8px 12px", background: "#f0f4f0", fontSize: 11,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
    color: "#6b866b", textAlign: "left", borderBottom: "1px solid #d0e4d0",
  };
  const td: React.CSSProperties = {
    padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #eef5ee", verticalAlign: "middle",
  };

  if (block.type === "header") return (
    <div style={{ padding: "20px 0 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#18a813", marginBottom: 4 }}>
            {data.company.tradeName}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#0d1a0d", lineHeight: 1.2 }}>
            Relatório Financeiro
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#6b866b", lineHeight: 1.7 }}>
          <div>CNPJ {data.company.cnpj?.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</div>
          <div>Emitido em {data.generatedAt}</div>
        </div>
      </div>
      <div style={{ height: 2, background: "linear-gradient(90deg, #18a813 0%, #d0e4d0 60%, transparent 100%)" }} />
    </div>
  );

  if (block.type === "summary") return (
    <>
      <SectionTitle label="Resumo Financeiro" />
      <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "auto", gap: 10 }}>
        {[
          { label: "A Receber",    value: data.summary.totalReceivable, color: "#0d7a6b" },
          { label: "A Pagar",      value: data.summary.totalPayable,    color: "#b01c1c" },
          { label: "Em Atraso",    value: data.summary.overdueTotal,    color: "#b84f07" },
          { label: "Saldo Líquido",value: data.summary.netBalance,      color: data.summary.isPositive ? "#18a813" : "#b01c1c" },
        ].map(k => (
          <div key={k.label} style={{ border: "1px solid #d0e4d0", borderRadius: 9, padding: "12px 14px", borderLeft: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b866b", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color, wordBreak: "break-word" }}>{k.value}</div>
          </div>
        ))}
      </div>
    </>
  );

  if (block.type === "receivables") {
    if (!data.receivables.length) return <><SectionTitle label="Títulos a Receber" /><p style={{ padding: "12px 16px", color: "#6b866b", fontSize: 13 }}>Nenhum título a receber em aberto.</p></>;
    return (
      <>
        <SectionTitle label="Títulos a Receber" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Descrição</th><th style={th}>Categoria</th><th style={th}>Vencimento</th><th style={{...th,textAlign:"right"}}>Valor</th><th style={th}>Situação</th></tr></thead>
          <tbody>
            {data.receivables.map((r: any, i: number) => (
              <tr key={i}>
                <td style={td}><strong style={{ fontSize: 12 }}>{r.description}</strong></td>
                <td style={{...td,color:"#6b866b",fontSize:12}}>{r.category}</td>
                <td style={{...td,whiteSpace:"nowrap"}}>{r.dueDate}</td>
                <td style={{...td,textAlign:"right",fontWeight:700}}>{r.amount}</td>
                <td style={td}>{r.daysOverdue > 0 ? <span style={{color:"#b84f07",fontWeight:700}}>{r.daysOverdue}d atraso</span> : <span style={{color:"#0d7a6b",fontWeight:700}}>Em dia</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (block.type === "payables") {
    if (!data.payables.length) return <><SectionTitle label="Títulos a Pagar" /><p style={{ padding: "12px 16px", color: "#6b866b", fontSize: 13 }}>Nenhum título a pagar em aberto.</p></>;
    return (
      <>
        <SectionTitle label="Títulos a Pagar" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Descrição</th><th style={th}>Categoria</th><th style={th}>Vencimento</th><th style={{...th,textAlign:"right"}}>Valor</th></tr></thead>
          <tbody>
            {data.payables.map((r: any, i: number) => (
              <tr key={i}>
                <td style={td}><strong style={{fontSize:12}}>{r.description}</strong></td>
                <td style={{...td,color:"#6b866b",fontSize:12}}>{r.category}</td>
                <td style={{...td,whiteSpace:"nowrap"}}>{r.dueDate}</td>
                <td style={{...td,textAlign:"right",fontWeight:700,color:"#b01c1c"}}>{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (block.type === "aging_receivable" || block.type === "aging_payable") {
    const label = block.type === "aging_receivable" ? "Vencimentos a Receber" : "Vencimentos a Pagar";
    const rows  = block.type === "aging_receivable" ? data.agingReceivable : data.agingPayable;
    return (
      <>
        <SectionTitle label={label} />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Faixa</th><th style={{...th,textAlign:"center"}}>Qtd</th><th style={{...th,textAlign:"right"}}>Valor</th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.label}>
                <td style={td}><strong>{r.label}</strong></td>
                <td style={{...td,textAlign:"center"}}>{r.count}</td>
                <td style={{...td,textAlign:"right",fontWeight:700}}>{new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (block.type === "settled") {
    if (!data.settled.length) return <><SectionTitle label="Títulos Pagos" /><p style={{ padding: "12px 16px", color: "#6b866b", fontSize: 13 }}>Nenhum título pago registrado.</p></>;
    return (
      <>
        <SectionTitle label="Títulos Pagos" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Descrição</th><th style={th}>Tipo</th><th style={th}>Vencimento</th><th style={{...th,textAlign:"right"}}>Valor</th></tr></thead>
          <tbody>
            {data.settled.map((r: any, i: number) => (
              <tr key={i}>
                <td style={td}><strong style={{fontSize:12}}>{r.description}</strong></td>
                <td style={{...td,color:"#6b866b",fontSize:12}}>{r.direction === "RECEIVABLE" ? "A receber" : "A pagar"}</td>
                <td style={{...td,whiteSpace:"nowrap"}}>{r.dueDate}</td>
                <td style={{...td,textAlign:"right",fontWeight:700,color:"#0d7a6b"}}>{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (block.type === "alunos") {
    /* Remove empresas (CNPJ = 14 dígitos) e deduplica por nome normalizado */
    const seenName = new Set<string>();
    const unique = (data.alunos as any[])
      .filter(a => {
        const digits = (a.document ?? "").replace(/\D/g, "");
        return digits.length !== 14; // exclui CNPJs (empresas)
      })
      .filter(a => {
        const key = (a.name ?? "").toLowerCase().trim();
        if (seenName.has(key)) return false;
        seenName.add(key); return true;
      })
      .sort((a: any, b: any) => (a.name ?? "").localeCompare(b.name ?? "", "pt-BR"));
    return (
      <>
        <SectionTitle label="Lista de Alunos" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Nome</th><th style={th}>CPF</th><th style={th}>Cidade</th><th style={th}>E-mail</th><th style={th}>Portal</th></tr></thead>
          <tbody>
            {unique.map((a: any, i: number) => (
              <tr key={i}>
                <td style={{...td,fontWeight:600,fontSize:12}}>{a.name}</td>
                <td style={{...td,fontFamily:"monospace",fontSize:11}}>{fmtDoc(a.document)}</td>
                <td style={{...td,color:"#6b866b",fontSize:12}}>{a.city && a.state ? `${a.city}/${a.state}` : "—"}</td>
                <td style={{...td,color:"#6b866b",fontSize:12}}>{a.email || "—"}</td>
                <td style={td}>{a.hasPortalAccess ? <span style={{color:"#0d7a6b",fontWeight:700}}>✓ Ativo</span> : <span style={{color:"#b84f07"}}>Inativo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (block.type === "notes") {
    if (!block.notes) return (
      <div className="no-print" style={{ padding: "12px 16px", fontSize: 13, color: "#6b866b", fontStyle: "italic" }}>
        Clique em Editar para adicionar observações...
      </div>
    );
    return (
      <>
        <SectionTitle label="Observações" />
        <div style={{ padding: "12px 16px", fontSize: 13, whiteSpace: "pre-wrap", color: "#0d1a0d", lineHeight: 1.6 }}>{block.notes}</div>
      </>
    );
  }

  return null;
}

/* ─── Mobile: seleção por toggle ────────────────────────────────────────── */
function MobileReportBuilder({ data }: { data: any }) {
  const [selected, setSelected] = useState<BlockType[]>(["header", "summary"]);
  const [preview,  setPreview]  = useState(false);
  const [printing, setPrinting] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notesVal,  setNotesVal]  = useState("");

  function toggle(type: BlockType) {
    setSelected(s =>
      s.includes(type) ? s.filter(t => t !== type) : [...s, type]
    );
  }

  function move(type: BlockType, dir: -1 | 1) {
    setSelected(s => {
      const idx = s.indexOf(type);
      if (idx + dir < 0 || idx + dir >= s.length) return s;
      const n = [...s];
      [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]];
      return n;
    });
  }

  function print() {
    // Garante que o preview está visível antes de imprimir
    if (!preview) {
      setPreview(true);
      // Aguarda o React renderizar o canvas antes de imprimir
      setTimeout(() => doPrint(), 300);
      return;
    }
    doPrint();
  }

  function doPrint() {
    const canvas = document.getElementById("report-canvas");
    if (!canvas) { window.print(); return; }
    const ph = document.createElement("div");
    ph.id = "report-canvas-placeholder";
    canvas.parentNode?.insertBefore(ph, canvas);
    document.body.appendChild(canvas);
    setPrinting(true);
    setTimeout(() => {
      window.print();
      ph.parentNode?.insertBefore(canvas, ph);
      ph.remove();
      setPrinting(false);
    }, 200);
  }

  const blocks: Block[] = selected.map(type =>
    type === "notes" ? { id: "notes", type, notes: notesVal } : { id: type, type }
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header fixo */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 12, boxShadow: "var(--shadow-sm)" }}>
        <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 3 }}>Relatórios</div>
        <h2 style={{ margin: "2px 0 6px", fontSize: 18, fontWeight: 800 }}>Montar relatório</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPreview(v => !v)}
            style={{ flex: 1, padding: "10px", background: preview ? "var(--primary-soft)" : "var(--surface-soft)", color: preview ? "var(--primary-dark)" : "var(--text-soft)", border: `1px solid ${preview ? "var(--primary)" : "var(--border)"}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {preview ? "← Editar" : "Visualizar"}
          </button>
          <button onClick={print} disabled={printing || selected.length === 0}
            style={{ flex: 1, padding: "10px", background: selected.length === 0 ? "var(--surface-soft)" : "var(--primary)", color: selected.length === 0 ? "var(--text-faint)" : "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: selected.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {preview ? (
        /* Preview */
        <div id="report-canvas" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {blocks.map((block, i) => (
            <div key={block.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "clip", boxShadow: "var(--shadow-sm)" }}>
              <BlockContent block={block} data={data} />
            </div>
          ))}
        </div>
      ) : (
        /* Seletor de blocos */
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PALETTE.map(p => {
            const isOn  = selected.includes(p.type);
            const idx   = selected.indexOf(p.type);
            return (
              <div key={p.type} style={{ background: "var(--surface)", border: `1px solid ${isOn ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: isOn ? `0 0 0 2px var(--primary-glow)` : "var(--shadow-sm)", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}
                  onClick={() => toggle(p.type)}>
                  {/* Toggle */}
                  <div style={{ width: 44, height: 24, borderRadius: 999, background: isOn ? "var(--primary)" : "var(--border)", position: "relative", flexShrink: 0, transition: "background 0.2s", cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: 3, left: isOn ? 22 : 3, width: 18, height: 18, borderRadius: 999, background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isOn ? "var(--text)" : "var(--text-soft)" }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{p.description}</div>
                  </div>
                </div>

                {/* Notas: campo de texto quando ativo */}
                {isOn && p.type === "notes" && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px" }}
                    onClick={e => e.stopPropagation()}>
                    <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)}
                      placeholder="Digite as observações..."
                      style={{ width: "100%", minHeight: 80, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 7, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", color: "var(--text)", background: "var(--surface-soft)", boxSizing: "border-box" }} />
                  </div>
                )}

                {/* Reordenar quando ativo */}
                {isOn && selected.length > 1 && (
                  <div style={{ display: "flex", gap: 8, padding: "8px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-muted)" }}
                    onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 11, color: "var(--text-faint)", flex: 1 }}>Posição {idx + 1} de {selected.length}</span>
                    <button onClick={() => move(p.type, -1)} disabled={idx === 0}
                      style={{ border: "none", background: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "var(--border)" : "var(--primary)", fontWeight: 700, fontSize: 18, lineHeight: 1, padding: "0 6px" }}>↑</button>
                    <button onClick={() => move(p.type, 1)} disabled={idx === selected.length - 1}
                      style={{ border: "none", background: "none", cursor: idx === selected.length - 1 ? "default" : "pointer", color: idx === selected.length - 1 ? "var(--border)" : "var(--primary)", fontWeight: 700, fontSize: 18, lineHeight: 1, padding: "0 6px" }}>↓</button>
                  </div>
                )}
              </div>
            );
          })}
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-faint)", margin: "4px 0 16px" }}>
            {selected.length === 0 ? "Nenhum bloco selecionado" : `${selected.length} bloco${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal (detecta mobile) ────────────────────────────── */
export function ReportBuilder({ data }: { data: any }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 980);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (isMobile) return <MobileReportBuilder data={data} />;
  return <DesktopReportBuilder data={data} />;
}

/* ─── Builder desktop ────────────────────────────────────────────────────── */
function DesktopReportBuilder({ data }: { data: any }) {
  const [canvas, setCanvas]     = useState<Block[]>([
    { id: uid(), type: "header" },
    { id: uid(), type: "summary" },
  ]);
  const [editNotes, setEditNotes] = useState<string | null>(null);
  const [notesVal, setNotesVal]   = useState("");
  const [printing, setPrinting]   = useState(false);

  const dragItem    = useRef<number | null>(null);
  const dragFromPal = useRef<BlockType | null>(null);
  const didDrop     = useRef(false);        // evita duplo-drop por bubbling
  const [dragOver,  setDragOver] = useState<number | "bottom" | null>(null);

  function resetDrag() {
    dragItem.current    = null;
    dragFromPal.current = null;
    didDrop.current     = false;
    setDragOver(null);
  }

  /* Drag from palette */
  function onPaletteDragStart(type: BlockType) {
    dragFromPal.current = type;
    dragItem.current    = null;
    didDrop.current     = false;
  }

  /* Drag within canvas */
  function onCanvasDragStart(idx: number) {
    dragItem.current    = idx;
    dragFromPal.current = null;
    didDrop.current     = false;
  }

  function onDragOver(e: React.DragEvent, target: number | "bottom") {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(target);
  }

  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    if (didDrop.current) return;
    didDrop.current = true;

    if (dragFromPal.current) {
      const type = dragFromPal.current;
      setCanvas(prev => { const n = [...prev]; n.splice(idx, 0, { id: uid(), type }); return n; });
    } else if (dragItem.current !== null && dragItem.current !== idx) {
      const from = dragItem.current;
      setCanvas(prev => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(idx, 0, m); return n; });
    }
    resetDrag();
  }

  function onDropBottom(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (didDrop.current) return;
    didDrop.current = true;

    if (dragFromPal.current) {
      const type = dragFromPal.current;
      setCanvas(prev => [...prev, { id: uid(), type }]);
    } else if (dragItem.current !== null) {
      const from = dragItem.current;
      setCanvas(prev => { const n = [...prev]; const [m] = n.splice(from, 1); return [...n, m]; });
    }
    resetDrag();
  }

  function onDragEnd() { resetDrag(); }

  function removeBlock(id: string) { setCanvas(c => c.filter(b => b.id !== id)); }

  function moveBlock(id: string, dir: -1 | 1) {
    setCanvas(c => {
      const idx = c.findIndex(b => b.id === id);
      if (idx + dir < 0 || idx + dir >= c.length) return c;
      const next = [...c];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next;
    });
  }

  function addBlock(type: BlockType) {
    setCanvas(c => [...c, { id: uid(), type }]);
  }

  function print() {
    const canvas = document.getElementById("report-canvas");
    if (!canvas) { window.print(); return; }

    // Move o canvas para o body para impressão full-width
    const placeholder = document.createElement("div");
    placeholder.id = "report-canvas-placeholder";
    canvas.parentNode?.insertBefore(placeholder, canvas);
    document.body.appendChild(canvas);

    setPrinting(true);
    setTimeout(() => {
      window.print();
      // Restaura a posição original
      placeholder.parentNode?.insertBefore(canvas, placeholder);
      placeholder.remove();
      setPrinting(false);
    }, 200);
  }

  const paletteLabel: Record<BlockType, string> = Object.fromEntries(PALETTE.map(p => [p.type, p.label])) as any;

  return (
    <>
      {/* Estilos de impressão em globals.css evitam hydration mismatch */}
      {false && <style>{`
        @media print {
          /* 1. Oculta toda a UI */
          body > * { display: none !important; }

          /* 2. Canvas vai para o body via JS — torna visível */
          #report-canvas {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
            padding: 20px 28px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            background: white !important;
            font-family: "Inter", "Segoe UI", system-ui, sans-serif !important;
          }
          #report-canvas, #report-canvas * { visibility: visible !important; }

          /* 3. Oculta toolbars e controles dentro do canvas */
          #report-canvas .no-print { display: none !important; visibility: hidden !important; }

          /* Mostra o rodapé de confidencialidade */
          #report-canvas .print-footer { display: block !important; visibility: visible !important; }

          /* 4. Cada bloco — sem borda, só separação visual */
          #report-canvas > div {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            page-break-inside: avoid;
            break-inside: avoid;
            background: white !important;
            padding-bottom: 14px !important;
            border-bottom: 1px solid #e0eae0 !important;
            margin-bottom: 0 !important;
          }
          #report-canvas > div:last-child { border-bottom: none !important; }

          /* 5. Títulos de seção */
          #report-canvas [style*="border-bottom: 2px solid #d0e4d0"] {
            border-bottom: 1.5px solid #18a813 !important;
            padding-bottom: 6px !important;
            margin-bottom: 8px !important;
          }

          /* 6. Tabelas */
          table   { width: 100% !important; border-collapse: collapse !important; font-size: 10.5pt !important; }
          th      { background: #f4faf4 !important; color: #3d5c3d !important; font-size: 8.5pt !important; padding: 6px 10px !important; border-bottom: 1.5px solid #d0e4d0 !important; text-align: left !important; }
          td      { padding: 6px 10px !important; font-size: 10pt !important; border-bottom: 1px solid #eef5ee !important; vertical-align: middle !important; }
          tr:last-child td { border-bottom: none !important; }

          /* 7. KPI cards — grid limpo */
          #report-canvas [style*="gridTemplateColumns"] { gap: 10px !important; }
          #report-canvas [style*="border-left: 4px solid"] {
            padding: 10px 12px !important;
          }
          #report-canvas [style*="font-size: 18px"] {
            font-size: 14pt !important;
            word-break: normal !important;
            white-space: nowrap !important;
          }

          /* 8. Cabeçalho do relatório */
          #report-canvas [style*="textAlign: center"] {
            padding: 16px 0 12px !important;
          }

          @page {
            size: A4;
            margin: 12mm 16mm 14mm 16mm;
          }
        }
      `}</style>}

      {/* Page header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"14px 20px", boxShadow:"var(--shadow-sm)" }}>
        <div>
          <div className="eyebrow" style={{ color:"var(--primary)", marginBottom: 3 }}>Relatórios</div>
          <h2 style={{ margin:"2px 0", fontSize:20, fontWeight:800, letterSpacing:"-0.02em" }}>Construtor de relatórios</h2>
          <p style={{ margin:0, fontSize:13, color:"var(--text-soft)" }}>Arraste os blocos para montar seu relatório personalizado</p>
        </div>
        <button onClick={print} disabled={printing || canvas.length === 0}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background: canvas.length === 0 ? "var(--surface-soft)" : "var(--primary)", color: canvas.length === 0 ? "var(--text-faint)" : "white", border:"none", borderRadius:"var(--radius-sm)", fontSize:13, fontWeight:700, cursor: canvas.length === 0 ? "not-allowed" : "pointer", boxShadow: canvas.length === 0 ? "none" : "0 2px 8px var(--primary-glow)" }}>
          <Printer size={15} /> Imprimir / PDF
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:14, alignItems:"start" }}>

        {/* Paleta */}
        <div className="no-print" style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", boxShadow:"var(--shadow-sm)", overflow:"hidden", position:"sticky", top:68 }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", background:"var(--surface-muted)" }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-faint)", marginBottom:2 }}>Blocos disponíveis</div>
            <div style={{ fontSize:12, color:"var(--text-soft)" }}>Arraste para o canvas →</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:2, padding:8 }}>
            {PALETTE.map(p => {
              const already = canvas.some(b => b.type === p.type && p.type !== "notes");
              return (
                <div key={p.type}
                  draggable={!already}
                  onDragStart={e => { e.stopPropagation(); onPaletteDragStart(p.type); }}
                  onDragEnd={onDragEnd}
                  style={{
                    display:"flex", alignItems:"flex-start", gap:10,
                    padding:"10px 12px", borderRadius:8, cursor: already ? "default" : "grab",
                    border:"1px solid", transition:"all 0.12s",
                    borderColor: already ? "var(--border)" : "var(--border)",
                    background: already ? "var(--surface-muted)" : "var(--surface)",
                    opacity: already ? 0.5 : 1,
                    userSelect:"none",
                  }}
                  onMouseEnter={e => { if (!already) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                >
                  <div style={{ width:28, height:28, borderRadius:7, background:"var(--primary-soft)", color:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    {p.icon}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{p.label}</div>
                    <div style={{ fontSize:11, color:"var(--text-faint)", lineHeight:1.4 }}>{p.description}</div>
                  </div>
                  {!already && (
                    <button type="button" onClick={() => addBlock(p.type)} title="Adicionar"
                      style={{ marginLeft:"auto", flexShrink:0, width:22, height:22, borderRadius:6, border:"1px solid var(--border)", background:"var(--surface)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--primary)" }}>
                      <Plus size={12}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div id="report-canvas" style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {canvas.length === 0 && (
            <div
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver("bottom"); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={onDropBottom}
              style={{ border:`2px dashed ${dragOver === "bottom" ? "var(--primary)" : "var(--border)"}`, borderRadius:"var(--radius-lg)", padding:"60px 24px", textAlign:"center", color:"var(--text-faint)", fontSize:14, background: dragOver === "bottom" ? "var(--primary-soft)" : "transparent", transition:"all 0.12s" }}>
              <FileText size={32} style={{ margin:"0 auto 12px", display:"block", opacity:0.3 }} />
              Arraste blocos da paleta para começar seu relatório
            </div>
          )}

          {canvas.map((block, idx) => (
            <div key={block.id}
              draggable
              onDragStart={e => { e.stopPropagation(); onCanvasDragStart(idx); }}
              onDragEnd={onDragEnd}
              onDragOver={e => onDragOver(e, idx)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => onDrop(e, idx)}
              style={{ background:"var(--surface)", border:`1px solid ${dragOver === idx ? "var(--primary)" : "var(--border)"}`, borderRadius:"var(--radius-lg)", marginBottom: idx < canvas.length - 1 ? 10 : 0, boxShadow: dragOver === idx ? "0 0 0 3px var(--primary-glow)" : "var(--shadow-sm)", transition:"border-color 0.12s, box-shadow 0.12s", overflow:"clip" }}
            >
              {/* Block toolbar */}
              <div className="no-print" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"var(--surface-muted)", borderBottom:"1px solid var(--border)", cursor:"grab" }}>
                <GripVertical size={14} style={{ color:"var(--text-faint)", flexShrink:0 }} />
                <span style={{ fontSize:12, fontWeight:700, flex:1, color:"var(--text-soft)" }}>{paletteLabel[block.type]}</span>
                {block.type === "notes" && (
                  <button type="button" onClick={() => { setEditNotes(block.id); setNotesVal(block.notes ?? ""); }}
                    style={{ fontSize:11, fontWeight:700, padding:"3px 10px", border:"1px solid var(--border)", borderRadius:6, background:"var(--surface)", cursor:"pointer", color:"var(--text-soft)" }}>
                    Editar
                  </button>
                )}
                <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={idx === 0} title="Subir"
                  style={{ border:"none", background:"none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "var(--border)" : "var(--text-faint)", display:"flex" }}>
                  <ChevronUp size={14}/>
                </button>
                <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={idx === canvas.length - 1} title="Descer"
                  style={{ border:"none", background:"none", cursor: idx === canvas.length - 1 ? "default" : "pointer", color: idx === canvas.length - 1 ? "var(--border)" : "var(--text-faint)", display:"flex" }}>
                  <ChevronDown size={14}/>
                </button>
                <button type="button" onClick={() => removeBlock(block.id)} title="Remover"
                  style={{ border:"none", background:"none", cursor:"pointer", color:"var(--danger)", display:"flex" }}>
                  <Trash2 size={14}/>
                </button>
              </div>

              {/* Block content */}
              <BlockContent block={block} data={data} />
            </div>
          ))}

          {/* Rodapé de confidencialidade — visível só na impressão */}
          {canvas.length > 0 && (
            <div style={{ display:"none" }} className="print-footer">
              <div style={{ borderTop:"1px solid #d0e4d0", paddingTop:8, display:"flex", justifyContent:"space-between", fontSize:9, color:"#6b866b" }}>
                <span>{data.company.tradeName} · CNPJ {data.company.cnpj?.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</span>
                <span>Documento confidencial · Gerado em {data.generatedAt}</span>
              </div>
            </div>
          )}

          {/* Drop zone at the bottom */}
          {canvas.length > 0 && (
            <div className="no-print"
              onDragOver={e => e.preventDefault()} onDrop={onDropBottom}
              style={{ marginTop:10, border:`2px dashed ${dragOver === "bottom" ? "var(--primary)" : "var(--border)"}`, borderRadius:"var(--radius-lg)", padding:"16px", textAlign:"center", color: dragOver === "bottom" ? "var(--primary)" : "var(--text-faint)", fontSize:12, transition:"all 0.12s", background: dragOver === "bottom" ? "var(--primary-soft)" : "transparent" }}
              onDragOver={e => onDragOver(e, "bottom")}
              onDragLeave={() => setDragOver(null)}
            >
              Solte aqui para adicionar ao final
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição de observações */}
      {editNotes && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"var(--surface)", borderRadius:"var(--radius-lg)", padding:24, width:"100%", maxWidth:480, boxShadow:"var(--shadow-lg)" }}>
            <h3 style={{ margin:"0 0 12px", fontSize:16, fontWeight:800 }}>Editar observações</h3>
            <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)}
              style={{ width:"100%", minHeight:120, padding:"10px 12px", border:"1.5px solid var(--border)", borderRadius:8, fontSize:14, fontFamily:"inherit", resize:"vertical", outline:"none", color:"var(--text)" }}
              placeholder="Digite as observações do relatório..." autoFocus />
            <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
              <button type="button" onClick={() => setEditNotes(null)}
                style={{ padding:"8px 18px", border:"1px solid var(--border)", borderRadius:8, background:"none", cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--text-soft)" }}>
                Cancelar
              </button>
              <button type="button" onClick={() => {
                setCanvas(c => c.map(b => b.id === editNotes ? { ...b, notes: notesVal } : b));
                setEditNotes(null);
              }}
                style={{ padding:"8px 18px", border:"none", borderRadius:8, background:"var(--primary)", color:"white", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
