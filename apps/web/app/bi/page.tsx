import { FilterBar } from "../components/filter-bar";
import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatCard } from "../components/stat-card";
import { formatCurrency, getBi, getMasterData } from "../lib/erp";
import { BarChart3, Boxes, ShoppingBag, Wallet } from "lucide-react";

export default async function BiPage() {
  const [bi, master] = await Promise.all([getBi(), getMasterData()]);

  return (
    <ErpShell currentPath="/bi" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="BI"
        title="Indicadores gerenciais"
        description="Painel executivo limpo para resultado, DRE resumida, estoque e volumes operacionais."
      />

      <FilterBar
        items={[
          { label: "Receita", value: formatCurrency(bi.kpis.revenue) },
          { label: "Despesa", value: formatCurrency(bi.kpis.expense) },
          { label: "Resultado", value: formatCurrency(bi.kpis.operatingResult) }
        ]}
      />

      <section className="stats-grid">
        <StatCard label="Receita" value={formatCurrency(bi.kpis.revenue)} detail="Receita operacional consolidada." icon={<Wallet size={16} />} />
        <StatCard label="Despesa" value={formatCurrency(bi.kpis.expense)} detail="Custos e obrigacoes financeiras." icon={<ShoppingBag size={16} />} />
        <StatCard label="Estoque" value={formatCurrency(bi.kpis.inventoryValue)} detail="Valor atual do estoque." icon={<Boxes size={16} />} />
        <StatCard label="Resultado" value={formatCurrency(bi.kpis.operatingResult)} detail="Resultado operacional resumido." icon={<BarChart3 size={16} />} />
      </section>

      <section className="workspace-grid">
        <div className="span-7">
          <SectionCard eyebrow="DRE" title="Resultado operacional" description="Estrutura simplificada pronta para evoluir com demonstrativos completos.">
            <div className="stack">
              {bi.dre.map((line: any) => (
                <div key={line.label} className="list-row">
                  <div><strong>{line.label}</strong></div>
                  <div className="align-right"><span>{formatCurrency(line.amount)}</span></div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="span-5">
          <SectionCard eyebrow="Top estoque" title="Maiores valores" description="Preparado para receber graficos e curvas analiticas futuras." compact>
            <div className="stack">
              {bi.topInventory.map((item: any) => (
                <div key={item.sku} className="list-row">
                  <div>
                    <strong>{item.sku}</strong>
                    <p>{item.product}</p>
                  </div>
                  <div className="align-right">
                    <span>{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </ErpShell>
  );
}
