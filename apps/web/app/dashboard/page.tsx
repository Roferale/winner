import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { CobrarButton } from "../components/cobrar-button";
import { DataTable } from "../components/data-table";
import { EmptyState } from "../components/empty-state";
import { ErpShell } from "../components/erp-shell";
import { StatusBadge } from "../components/status-badge";
import { formatCurrency, formatDate, getAlunos, getFinancialControl, getMasterData } from "../lib/erp";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace(":3001", ":3000") ?? "http://localhost:3000";

export default async function DashboardPage() {
  const [data, alunos, master] = await Promise.all([
    getFinancialControl(),
    getAlunos(),
    getMasterData()
  ]);

  const totalReceivable = Number(data.summary.totalReceivable);
  const totalPayable    = Number(data.summary.totalPayable);
  const overdueTotal    = Number(data.summary.overdueReceivable) + Number(data.summary.overduePayable);
  const netBalance      = Number(data.summary.netBalance);
  const isPositive      = netBalance >= 0;

  const openEntries    = data.entries.filter((e: any) => ["OPEN","PARTIALLY_SETTLED","OVERDUE"].includes(e.status));
  const overdueEntries = openEntries.filter((e: any) => e.daysOverdue > 0);
  const receivables    = openEntries.filter((e: any) => e.direction === "RECEIVABLE");
  const payables       = openEntries.filter((e: any) => e.direction === "PAYABLE");
  const comPortal      = alunos.alunos.filter((a: any) => a.hasPortalAccess).length;

  return (
    <ErpShell currentPath="/dashboard" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>

      {/* Alerta de inadimplência */}
      {overdueEntries.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 18px", borderRadius: "var(--radius-lg)",
          background: "var(--warning-soft)", border: "1px solid var(--warning)",
          fontSize: 13, fontWeight: 600, color: "var(--warning)"
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            {overdueEntries.length} {overdueEntries.length === 1 ? "título vencido" : "títulos vencidos"} totalizando{" "}
            <strong>{formatCurrency(overdueTotal)}</strong> — regularize para evitar inadimplência.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid"  >
        <KpiCard
          label="A Receber"
          value={formatCurrency(totalReceivable)}
          detail={plural(receivables.length, "título", "em aberto")}
          trend="up"
          accent="#0d7a6b"
          accentSoft="#d8f5ef"
          icon={<TrendingUp size={16} />}
        />
        <KpiCard
          label="A Pagar"
          value={formatCurrency(totalPayable)}
          detail={plural(payables.length, "título", "em aberto")}
          trend="down"
          accent="#b01c1c"
          accentSoft="#fde8e8"
          icon={<TrendingDown size={16} />}
        />
        <KpiCard
          label="Em Atraso"
          value={formatCurrency(overdueTotal)}
          detail={plural(overdueEntries.length, "título", "vencido")}
          trend={overdueTotal > 0 ? "alert" : "ok"}
          accent={overdueTotal > 0 ? "#b84f07" : "#0d7a6b"}
          accentSoft={overdueTotal > 0 ? "#fef0e6" : "#d8f5ef"}
          icon={overdueTotal > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
        />
        <KpiCard
          label="Saldo Líquido"
          value={formatCurrency(netBalance)}
          detail={isPositive ? "Posição positiva" : "Posição negativa"}
          trend={isPositive ? "ok" : "alert"}
          accent={isPositive ? "#18a813" : "#b01c1c"}
          accentSoft={isPositive ? "#e0f5df" : "#fde8e8"}
          icon={<Wallet size={16} />}
        />
      </div>

      {/* Corpo principal */}
      <div className="workspace-grid">

        {/* Coluna principal — títulos a receber */}
        <div className="span-8" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <SCard eyebrow="Recebimentos" title="Títulos a receber"
            detail={`${receivables.length === 0 ? "Nenhum" : receivables.length} título${receivables.length !== 1 ? "s" : ""} em aberto`}>
            {receivables.length === 0 ? (
              <EmptyState title="Nenhum título a receber" description="Crie lançamentos na página Financeiro." />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Descrição</th>
                    <th style={{ textAlign: "left" }}>Vencimento</th>
                    <th style={{ textAlign: "left" }}>Situação</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                    <th style={{ textAlign: "right" }}>Cobrar</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((entry: any) => (
                    <tr key={entry.id}>
                      <td>
                        <strong style={{ fontSize: 13 }}>{entry.description}</strong>
                        <span className="cell-subtitle">{entry.category}</span>
                      </td>
                      <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(entry.dueDate)}</td>
                      <td>
                        {entry.daysOverdue === 0
                          ? <span className="status-badge status-success">Em dia</span>
                          : entry.daysOverdue <= 30
                            ? <span className="status-badge status-warning">{entry.daysOverdue}d atraso</span>
                            : <span className="status-badge status-danger">{entry.daysOverdue}d atraso</span>
                        }
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: 14 }}>{formatCurrency(entry.amount)}</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <CobrarButton entryId={entry.id} webUrl={WEB_URL} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </SCard>

          {/* A pagar */}
          {payables.length > 0 && (
            <SCard eyebrow="Pagamentos" title="Contas a pagar"
              detail={`${payables.length} título${payables.length !== 1 ? "s" : ""} em aberto`}>
              <DataTable>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Descrição</th>
                    <th style={{ textAlign: "left" }}>Vencimento</th>
                    <th style={{ textAlign: "left" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map((entry: any) => (
                    <tr key={entry.id}>
                      <td>
                        <strong style={{ fontSize: 13 }}>{entry.description}</strong>
                        <span className="cell-subtitle">{entry.category}</span>
                      </td>
                      <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(entry.dueDate)}</td>
                      <td><StatusBadge value={entry.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: 14, color: "var(--danger)" }}>{formatCurrency(entry.amount)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </SCard>
          )}
        </div>

        {/* Sidebar direita */}
        <div className="span-4">
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden", position: "sticky", top: 68 }}>

            {/* Vencimentos por prazo */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
              <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 2 }}>Vencimentos</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>A receber por prazo</div>
            </div>
            <div style={{ padding: "8px 0" }}>
              {data.agingReceivable.map((b: any) => (
                <div key={b.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px" }}>
                  <span style={{ fontSize: 13, color: "var(--text-soft)" }}>{b.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: b.count > 0 ? "var(--text)" : "var(--text-faint)" }}>{formatCurrency(b.amount)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{b.count} título{b.count !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Divisor */}
            <div style={{ height: 1, background: "var(--border)", margin: "0" }} />

            {/* Alunos */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
              <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 2 }}>Alunos</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Portal de pagamentos</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={13} style={{ color: "var(--text-faint)" }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{alunos.totals.totalAlunos}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "8px 0" }}>
              {alunos.alunos.slice(0, 7).map((a: any) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 16px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: a.hasPortalAccess ? "var(--primary-soft)" : "var(--surface-soft)", color: a.hasPortalAccess ? "var(--primary-dark)" : "var(--text-faint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                    {a.name.split(" ").slice(0,2).map((w: string) => w[0]).join("").toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.name.split(" ")[0]}
                  </span>
                  {a.hasPortalAccess
                    ? <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:11,fontWeight:700,color:"var(--success)",flexShrink:0 }}><CheckCircle size={11}/>Ativo</span>
                    : <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:11,color:"var(--text-faint)",flexShrink:0 }}><Clock size={11}/>Inativo</span>
                  }
                </div>
              ))}
              {alunos.totals.totalAlunos > 7 && (
                <div style={{ padding: "8px 16px 10px", fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
                  +{alunos.totals.totalAlunos - 7} alunos — <a href="/alunos" style={{ color: "var(--primary)", fontWeight: 600 }}>ver todos</a>
                </div>
              )}
            </div>

            {/* Rodapé com resumo */}
            <div style={{ padding: "10px 16px", background: "var(--surface-muted)", borderTop: "1px solid var(--border)", display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>Com portal</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--success)" }}>{comPortal}</div>
              </div>
              <div style={{ width: 1, background: "var(--border)" }} />
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>Sem portal</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-faint)" }}>{alunos.totals.totalAlunos - comPortal}</div>
              </div>
              <div style={{ width: 1, background: "var(--border)" }} />
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>Total</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{alunos.totals.totalAlunos}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErpShell>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function plural(n: number, word: string, suffix: string) {
  return `${n} ${word}${n !== 1 ? "s" : ""} ${suffix}`;
}

function KpiCard({ label, value, detail, trend, accent, accentSoft, icon }: {
  label: string; value: string; detail: string;
  trend: "up" | "down" | "ok" | "alert";
  accent: string; accentSoft: string; icon: React.ReactNode;
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;
  return (
    <div className="stat-card" style={{ "--stat-accent": accent } as React.CSSProperties}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: accentSoft, color: accent, flexShrink: 0 }}>
          {icon}
        </span>
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-faint)" }}>
        {TrendIcon && <TrendIcon size={13} style={{ color: accent }} />}
        {detail}
      </div>
    </div>
  );
}

function SCard({ eyebrow, title, detail, children }: {
  eyebrow: string; title: string; detail?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 2 }}>{eyebrow}</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        </div>
        {detail && <span className="pill">{detail}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}
