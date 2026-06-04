import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavProgress } from "./components/nav-progress";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: { default: "Winner Academia", template: "%s — Winner Academia" },
  description: "Controle financeiro e portal de pagamento — Winner Academia de Tênis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
