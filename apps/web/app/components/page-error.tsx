"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isOffline = error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch");

  return (
    <div className="content">
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: 320, gap: 16, textAlign: "center",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: 40, boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "var(--warning-soft)", display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          <AlertTriangle size={24} style={{ color: "var(--warning)" }} />
        </div>

        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>
            {isOffline ? "API fora do ar" : "Erro ao carregar"}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-soft)", maxWidth: 380 }}>
            {isOffline
              ? "Não foi possível conectar ao servidor. Verifique se a API está rodando e tente novamente."
              : error.message || "Ocorreu um erro inesperado ao carregar esta página."}
          </p>
        </div>

        <button
          type="button" onClick={reset}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 20px", background: "var(--primary)", color: "white",
            border: "none", borderRadius: "var(--radius-sm)", fontSize: 13,
            fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px var(--primary-glow)"
          }}
        >
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    </div>
  );
}
