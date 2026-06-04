"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CobrarButton({ entryId, webUrl }: { entryId: string; webUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${webUrl}/pagar/${entryId}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`Olá! Segue o link para pagamento da sua mensalidade na Winner Academia 🎾\n${url}`)}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button
        type="button"
        onClick={copy}
        title="Copiar link de pagamento"
        style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",border:"1px solid var(--border)",borderRadius:6,background:"var(--surface)",fontSize:11,fontWeight:700,cursor:"pointer",color:"var(--text)",whiteSpace:"nowrap" }}
      >
        {copied ? <><Check size={11}/>Copiado</> : <><Copy size={11}/>Link</>}
      </button>
      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        title="Enviar por WhatsApp"
        style={{ display:"inline-flex",alignItems:"center",padding:"3px 8px",borderRadius:6,background:"#25D366",color:"white",fontSize:11,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap" }}
      >
        WA
      </a>
    </div>
  );
}
