"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavProgress() {
  const pathname              = usePathname();
  const [visible, setVisible] = useState(false);
  const [width,   setWidth]   = useState(0);
  const timer                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prev                  = useRef(pathname);

  useEffect(() => {
    if (pathname !== prev.current) {
      // Chegou na nova página — completa a barra
      prev.current = pathname;
      setWidth(100);
      timer.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }
  }, [pathname]);

  // Intercepta cliques em links para iniciar a barra
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      if (href === pathname) return;

      if (timer.current) clearTimeout(timer.current);
      setVisible(true);
      setWidth(0);
      // Anima até 80% — o restante completa quando pathname mudar
      requestAnimationFrame(() => {
        setWidth(15);
        setTimeout(() => setWidth(60), 100);
        setTimeout(() => setWidth(80), 800);
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      height: 3, pointerEvents: "none",
    }}>
      <div style={{
        height: "100%",
        width: `${width}%`,
        background: "linear-gradient(90deg, var(--primary), #6ee86a)",
        transition: width === 100 ? "width 0.2s ease" : "width 0.8s ease",
        borderRadius: "0 2px 2px 0",
        boxShadow: "0 0 8px rgba(24,168,19,0.5)",
      }} />
    </div>
  );
}
