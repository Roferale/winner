import { ErpShell } from "../components/erp-shell";
import { ReportBuilder } from "../components/report-builder";
import { formatCurrency, formatDate, getAlunos, getFinancialControl, getMasterData } from "../lib/erp";

export default async function RelatoriosPage() {
  const [data, alunos, master] = await Promise.all([
    getFinancialControl(),
    getAlunos(),
    getMasterData(),
  ]);

  const reportData = {
    company: master.company,
    generatedAt: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    summary: {
      totalReceivable: formatCurrency(data.summary.totalReceivable),
      totalPayable:    formatCurrency(data.summary.totalPayable),
      overdueTotal:    formatCurrency(Number(data.summary.overdueReceivable) + Number(data.summary.overduePayable)),
      netBalance:      formatCurrency(data.summary.netBalance),
      isPositive:      Number(data.summary.netBalance) >= 0,
    },
    receivables: data.entries
      .filter((e: any) => e.direction === "RECEIVABLE" && ["OPEN","PARTIALLY_SETTLED","OVERDUE"].includes(e.status))
      .map((e: any) => ({ description: e.description, category: e.category, dueDate: formatDate(e.dueDate), amount: formatCurrency(e.amount), status: e.status, daysOverdue: e.daysOverdue })),
    payables: data.entries
      .filter((e: any) => e.direction === "PAYABLE" && ["OPEN","PARTIALLY_SETTLED","OVERDUE"].includes(e.status))
      .map((e: any) => ({ description: e.description, category: e.category, dueDate: formatDate(e.dueDate), amount: formatCurrency(e.amount), status: e.status })),
    settled: data.entries
      .filter((e: any) => e.status === "SETTLED")
      .map((e: any) => ({ description: e.description, direction: e.direction, amount: formatCurrency(e.amount), dueDate: formatDate(e.dueDate) })),
    agingReceivable: data.agingReceivable,
    agingPayable:    data.agingPayable,
    alunos: alunos.alunos.map((a: any) => ({
      name: a.name, document: a.document, city: a.city, state: a.state,
      email: a.email, hasPortalAccess: a.hasPortalAccess,
    })),
    totals: alunos.totals,
  };

  return (
    <ErpShell currentPath="/relatorios" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <ReportBuilder data={reportData} />
    </ErpShell>
  );
}
