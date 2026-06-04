import { TrendingDown, TrendingUp, AlertTriangle, Scale } from "lucide-react";
import { BankImport } from "../components/bank-import";
import { CobrarButton } from "../components/cobrar-button";
import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { FinancialEntryForm } from "../components/financial-entry-form";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatCard } from "../components/stat-card";
import { StatusBadge } from "../components/status-badge";
import { formatCurrency, formatDate, getFinancialControl, getMasterData } from "../lib/erp";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const WEB_URL = process.env.NEXT_PUBLIC_API_URL?.replace(":3001", ":3000") ?? "http://localhost:3000";

function AgingBadge({ days }: { days: number }) {
  if (days === 0) return <span className="status-badge status-success">Em dia</span>;
  if (days <= 30)  return <span className="status-badge status-info">{days}d atraso</span>;
  if (days <= 60)  return <span className="status-badge status-warning">{days}d atraso</span>;
  return <span className="status-badge status-danger">{days}d atraso</span>;
}

export default async function FinanceiroPage() {
  const [data, master] = await Promise.all([getFinancialControl(), getMasterData()]);

  const totalReceivable  = Number(data.summary.totalReceivable);
  const totalPayable     = Number(data.summary.totalPayable);
  const overdueTotal     = Number(data.summary.overdueReceivable) + Number(data.summary.overduePayable);
  const netBalance       = Number(data.summary.netBalance);
  const isPositive       = netBalance >= 0;

  const openEntries = data.entries.filter((e: any) =>
    e.status === "OPEN" || e.status === "PARTIALLY_SETTLED" || e.status === "OVERDUE"
  );

  return (
    <ErpShell currentPath="/financeiro" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Financeiro"
        title="Controle financeiro"
        description="Contas a pagar e receber, lançamentos manuais e importação de extrato bancário."
        right={
          <>
            <div className="pill">Receber {formatCurrency(totalReceivable)}</div>
            <div className="pill">Pagar {formatCurrency(totalPayable)}</div>
            <div className={`pill ${isPositive ? "emphasis" : ""}`} style={!isPositive ? { background: "var(--danger-soft)", color: "var(--danger)" } : {}}>
              Saldo {formatCurrency(netBalance)}
            </div>
          </>
        }
      />

      {/* KPI cards */}
      <div className="kpi-grid"  >
        <StatCard
          label="A Receber"
          value={formatCurrency(totalReceivable)}
          detail={`${data.agingReceivable.reduce((s: number, b: any) => s + b.count, 0)} títulos em aberto`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="A Pagar"
          value={formatCurrency(totalPayable)}
          detail={`${data.agingPayable.reduce((s: number, b: any) => s + b.count, 0)} títulos em aberto`}
          icon={<TrendingDown size={18} />}
        />
        <StatCard
          label="Em Atraso"
          value={formatCurrency(overdueTotal)}
          detail={overdueTotal > 0 ? "Requer atenção" : "Nenhum vencido"}
          icon={<AlertTriangle size={18} />}
        />
        <StatCard
          label="Saldo Líquido"
          value={formatCurrency(netBalance)}
          detail={isPositive ? "Posição positiva" : "Posição negativa"}
          icon={<Scale size={18} />}
        />
      </div>

      {/* Aging summary */}
      <div className="aging-grid"  >
        <SectionCard eyebrow="Recebíveis" title="A receber por prazo" description="Distribuição dos títulos a receber por faixa de vencimento.">
          <DataTable>
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Qtd</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.agingReceivable.map((b: any) => (
                <tr key={b.label}>
                  <td><strong>{b.label}</strong></td>
                  <td>{b.count}</td>
                  <td>{formatCurrency(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>

        <SectionCard eyebrow="Pagamentos" title="A pagar por prazo" description="Distribuição dos títulos a pagar por faixa de vencimento.">
          <DataTable>
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Qtd</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.agingPayable.map((b: any) => (
                <tr key={b.label}>
                  <td><strong>{b.label}</strong></td>
                  <td>{b.count}</td>
                  <td>{formatCurrency(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>
      </div>

      {/* Actions */}
      <FinancialEntryForm apiUrl={API_URL} />
      <BankImport apiUrl={API_URL} />

      {/* Full entries table */}
      <SectionCard
        eyebrow="Títulos"
        title="Contas abertas"
        description={`${openEntries.length} título${openEntries.length !== 1 ? "s" : ""} em aberto · clique para detalhar`}
      >
        <DataTable>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Vencimento</th>
              <th>Atraso</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Cobrar</th>
            </tr>
          </thead>
          <tbody>
            {openEntries.map((entry: any) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.description}</strong>
                  <span className="cell-subtitle">{entry.sourceType}</span>
                </td>
                <td><StatusBadge value={entry.direction} /></td>
                <td>{entry.category}</td>
                <td>{formatDate(entry.dueDate)}</td>
                <td><AgingBadge days={entry.daysOverdue} /></td>
                <td><StatusBadge value={entry.status} /></td>
                <td>{formatCurrency(entry.amount)}</td>
                <td>
                  {entry.direction === "RECEIVABLE"
                    ? <CobrarButton entryId={entry.id} webUrl={WEB_URL} />
                    : <span style={{ color: "var(--text-faint)", fontSize: 12 }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </ErpShell>
  );
}
