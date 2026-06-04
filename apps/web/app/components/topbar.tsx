"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Search, LogOut, ChevronDown } from "lucide-react";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

export function Topbar({
  companyName,
  onMenuToggle
}: {
  companyName: string;
  companyCnpj: string;
  onMenuToggle: () => void;
}) {
  const router            = useRouter();
  const [open, setOpen]   = useState(false);
  const [loading, setLd]  = useState(false);

  async function logout() {
    setLd(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="app-topbar">
      <div className="topbar-leading">
        <button className="icon-button sidebar-toggle" type="button" aria-label="Abrir menu" onClick={onMenuToggle}>
          <Menu size={15} />
        </button>
        <label className="topbar-search">
          <Search size={13} style={{ flexShrink: 0, color: "var(--text-faint)" }} />
          <input placeholder="Buscar alunos, cobranças..." />
        </label>
      </div>

      <div className="topbar-meta">
        <button className="icon-button" type="button" aria-label="Notificações">
          <Bell size={14} />
        </button>

        {/* Profile dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="profile-button" type="button"
            onClick={() => setOpen(v => !v)}
            style={{ gap: 8 }}
          >
            <span className="avatar-dot">{initials(companyName)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{companyName}</span>
            <ChevronDown size={13} style={{ color: "var(--text-faint)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
          </button>

          {open && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setOpen(false)}
              />
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)",
                minWidth: 180, overflow: "hidden"
              }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{companyName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>Administrador</div>
                </div>
                <button
                  type="button" onClick={logout} disabled={loading}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: "none", border: "none",
                    cursor: "pointer", fontSize: 13, color: "var(--danger)",
                    fontWeight: 600, transition: "background var(--t-fast)"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--danger-soft)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <LogOut size={14} />
                  {loading ? "Saindo..." : "Sair da conta"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
