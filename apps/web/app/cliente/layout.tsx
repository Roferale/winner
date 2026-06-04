import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Winner Academia — Portal do Aluno",
  description: "Acesse suas cobranças e realize pagamentos"
};

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {children}
    </div>
  );
}
