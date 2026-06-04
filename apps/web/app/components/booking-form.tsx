"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Calendar, User } from "lucide-react";

type ClassSlot = {
  id: string; code: string; name: string; level: string;
  instructor: string; schedule: string; surface: string;
  capacity: number; booked: number; available: number;
};

type BookingResult = {
  ok: boolean; bookingId: string; personName: string;
  className: string; schedule: string; date: string;
};

const today   = () => new Date().toISOString().split("T")[0];
const maxDate = () => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().split("T")[0]; };

export function BookingForm({ classes, apiUrl }: { classes: ClassSlot[]; apiUrl: string }) {
  const [doc, setDoc]         = useState("");
  const [classCode, setCode]  = useState(classes[0]?.code ?? "");
  const [date, setDate]       = useState(today());
  const [state, setState]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult]   = useState<BookingResult | null>(null);
  const [errorMsg, setError]  = useState("");

  const selected = classes.find(c => c.code === classCode);

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1.5px solid var(--border)", background: "var(--surface)",
    fontSize: 15, color: "var(--text)", outline: "none"
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 700,
    color: "var(--text-soft)", marginBottom: 6
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading"); setError("");

    try {
      const res = await fetch(`${apiUrl}/booking/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: doc.replace(/\D/g, ""), classCode, date })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erro ao agendar");
      setResult(json);
      setState("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setState("error");
    }
  }

  if (state === "success" && result) {
    return (
      <div style={{ background: "var(--success-soft)", border: "1.5px solid var(--success)", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <CheckCircle size={48} style={{ color: "var(--success)", marginBottom: 16 }} />
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Agendamento confirmado!</h2>
        <p style={{ margin: "0 0 20px", color: "var(--text-soft)" }}>
          Olá, <strong>{result.personName}</strong>! Sua vaga está reservada.
        </p>
        <div style={{ background: "white", borderRadius: 12, padding: 20, display: "inline-block", textAlign: "left", minWidth: 260 }}>
          <div style={{ marginBottom: 8 }}><strong>Turma:</strong> {result.className}</div>
          <div style={{ marginBottom: 8 }}><strong>Horário:</strong> {result.schedule}</div>
          <div><strong>Data:</strong> {new Date(result.date).toLocaleDateString("pt-BR")}</div>
        </div>
        <br /><br />
        <button
          onClick={() => { setState("idle"); setDoc(""); setResult(null); }}
          style={{ padding: "10px 24px", background: "var(--primary)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Fazer outro agendamento
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={lbl}><User size={13} style={{ display: "inline", marginRight: 4 }} />CPF do aluno</label>
        <input style={inp} type="text" placeholder="000.000.000-00" value={doc}
          onChange={e => setDoc(e.target.value)} required maxLength={14} />
        <span style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4, display: "block" }}>
          Apenas alunos cadastrados podem agendar
        </span>
      </div>

      <div>
        <label style={lbl}><Calendar size={13} style={{ display: "inline", marginRight: 4 }} />Turma</label>
        <select style={inp} value={classCode} onChange={e => setCode(e.target.value)} required>
          {classes.map(c => (
            <option key={c.code} value={c.code} disabled={c.available === 0}>
              {c.name} — {c.schedule} ({c.available > 0 ? `${c.available} vagas` : "Lotada"})
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div style={{ background: "var(--surface-soft)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "var(--text-soft)" }}>
          <strong style={{ color: "var(--text)" }}>{selected.name}</strong><br />
          Professor: {selected.instructor} · Superfície: {selected.surface}<br />
          Vagas: {selected.booked}/{selected.capacity} ocupadas
        </div>
      )}

      <div>
        <label style={lbl}><Calendar size={13} style={{ display: "inline", marginRight: 4 }} />Data desejada</label>
        <input style={inp} type="date" value={date} min={today()} max={maxDate()}
          onChange={e => setDate(e.target.value)} required />
      </div>

      {state === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "var(--danger-soft)", borderRadius: 10, color: "var(--danger)", fontSize: 14 }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <button type="submit" disabled={state === "loading"} style={{
        padding: "14px", background: state === "loading" ? "var(--surface-soft)" : "var(--primary)",
        color: state === "loading" ? "var(--text-soft)" : "white",
        border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: state === "loading" ? "not-allowed" : "pointer"
      }}>
        {state === "loading" ? "Agendando..." : "Confirmar agendamento"}
      </button>
    </form>
  );
}
