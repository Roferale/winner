"use client";

import { useEffect, useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";

export function ErpShell({
  currentPath,
  companyName,
  companyCnpj,
  children
}: {
  currentPath: string;
  companyName: string;
  companyCnpj: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  return (
    <main className={sidebarOpen ? "erp-shell sidebar-open" : "erp-shell"}>
      <button
        type="button"
        aria-label="Fechar navegação"
        className={sidebarOpen ? "sidebar-backdrop visible" : "sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">{companyName}</span>
            <span className="sidebar-logo-sub">Financeiro</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <SidebarNav currentPath={currentPath} />

        {/* Rodapé com CNPJ */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-cnpj">
            CNPJ {companyCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
          </div>
          <div className="sidebar-footer-env">{process.env.NEXT_PUBLIC_ENV ?? "Desenvolvimento"}</div>
        </div>
      </aside>

      <section className="content-shell">
        <Topbar
          companyName={companyName}
          companyCnpj={companyCnpj}
          onMenuToggle={() => setSidebarOpen((value) => !value)}
        />
        <section className="content">{children}</section>
      </section>
    </main>
  );
}
