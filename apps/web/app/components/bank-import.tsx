"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, FileText, Upload } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export function BankImport({ apiUrl }: { apiUrl: string }) {
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<{ created: number; skipped: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("loading");
    setResult(null);
    setErrorMsg("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch(`${apiUrl}/demo/bank-statement/import`, { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Erro ao importar");
      setResult(json);
      setState("success");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setState("error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      className="section-card"
      style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <FileText size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
        <div>
          <strong style={{ fontSize: 14 }}>Importar extrato bancario</strong>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-soft)" }}>
            Arquivos OFX (todos os bancos) ou CSV (Data;Historico;Valor) — lancamentos criados automaticamente
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        {state === "success" && result && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--success)" }}>
            <CheckCircle size={15} />
            {result.created} lancamento{result.created !== 1 ? "s" : ""} criado{result.created !== 1 ? "s" : ""}
            {result.skipped > 0 && `, ${result.skipped} duplicado${result.skipped !== 1 ? "s" : ""} ignorado${result.skipped !== 1 ? "s" : ""}`}
          </span>
        )}
        {state === "error" && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--danger)" }}>
            <AlertCircle size={15} />
            {errorMsg}
          </span>
        )}

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: state === "loading" ? "var(--surface-soft)" : "var(--primary)",
            color: state === "loading" ? "var(--text-soft)" : "white",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            fontWeight: 700,
            cursor: state === "loading" ? "not-allowed" : "pointer",
            transition: "opacity 0.18s",
            whiteSpace: "nowrap"
          }}
        >
          <Upload size={15} />
          {state === "loading" ? "Importando..." : "Selecionar arquivo"}
          <input
            ref={fileRef}
            type="file"
            accept=".ofx,.csv"
            style={{ display: "none" }}
            disabled={state === "loading"}
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  );
}
