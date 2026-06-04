"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, PlusCircle } from "lucide-react";

const CATEGORIES = ["MENSALIDADE", "ALUGUEL", "FORNECEDOR", "FOLHA", "TAXA BANCARIA", "TRANSFERENCIA", "OUTROS"];

export function FinancialEntryForm({ apiUrl }: { apiUrl: string }) {
  const [direction, setDirection] = useState("RECEIVABLE");
  const [category, setCategory] = useState("MENSALIDADE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${apiUrl}/demo/actions/financial-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          category,
          description,
          amount: parseFloat(amount.replace(/\./g, "").replace(",", ".")),
          dueDate
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erro ao criar lançamento");
      setState("success");
      setDescription("");
      setAmount("");
      setDueDate("");
      router.refresh();
      setTimeout(() => setState("idle"), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setState("error");
    }
  }

  const field: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6
  };
  const label: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-soft)",
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  };
  const input: React.CSSProperties = {
    padding: "10px 12px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    width: "100%"
  };

  return (
    <div className="section-card" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <PlusCircle size={16} style={{ color: "var(--primary)" }} />
        <strong style={{ fontSize: 14 }}>Novo lançamento</strong>
        <span style={{ fontSize: 13, color: "var(--text-soft)" }}>— conta a pagar ou receber manual</span>

        {state === "success" && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--success)" }}>
            <CheckCircle size={14} /> Lançamento criado
          </span>
        )}
        {state === "error" && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--danger)" }}>
            <AlertCircle size={14} /> {errorMsg}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
        <div style={field}>
          <label style={label}>Tipo</label>
          <select style={input} value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="RECEIVABLE">A Receber</option>
            <option value="PAYABLE">A Pagar</option>
          </select>
        </div>

        <div style={field}>
          <label style={label}>Categoria</label>
          <select style={input} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={field}>
          <label style={label}>Descrição</label>
          <input
            style={input}
            type="text"
            placeholder="Ex: Mensalidade João Silva"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div style={field}>
          <label style={label}>Valor (R$)</label>
          <input
            style={input}
            type="text"
            placeholder="0,00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>

        <div style={field}>
          <label style={label}>Vencimento</label>
          <input
            style={input}
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={state === "loading"}
          style={{
            padding: "10px 20px",
            background: state === "loading" ? "var(--surface-soft)" : "var(--primary)",
            color: state === "loading" ? "var(--text-soft)" : "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            fontWeight: 700,
            cursor: state === "loading" ? "not-allowed" : "pointer",
            whiteSpace: "nowrap"
          }}
        >
          {state === "loading" ? "Salvando..." : "Lançar"}
        </button>
      </form>
    </div>
  );
}
