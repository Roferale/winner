import { DataTable } from "../components/data-table";
import { BomForm, ProductionOrderForm } from "../components/forms";
import { ErpShell } from "../components/erp-shell";
import { LaunchCard } from "../components/launch-card";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatusBadge } from "../components/status-badge";
import { formatQuantity, getMasterData, getProduction } from "../lib/erp";

export default async function ProducaoPage() {
  const [production, master] = await Promise.all([getProduction(), getMasterData()]);

  return (
    <ErpShell currentPath="/producao" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="PCP"
        title="Ordens e engenharia de producao"
        description="Cadastre BOMs e encerre OPs com consumo tecnico, entrada de acabado e rastreabilidade no estoque."
      />

      <section className="workspace-grid">
        <div className="span-6">
          <LaunchCard title="Encerrar ordem" description="Lanca a producao com consumo tecnico da BOM e retorno do produto acabado.">
            <ProductionOrderForm companyId={master.company.id} warehouses={master.warehouses} products={master.products} />
          </LaunchCard>
        </div>

        <div className="span-6">
          <LaunchCard title="Nova BOM" description="Defina a estrutura minima de engenharia usada pelo apontamento.">
            <BomForm companyId={master.company.id} products={master.products} />
          </LaunchCard>
        </div>

        <div className="span-7">
          <SectionCard eyebrow="Ordens" title="Historico de OPs" description="Visao do PCP por produto, deposito e quantidade realizada.">
            <DataTable>
              <thead>
                <tr>
                  <th>OP</th>
                  <th>Produto</th>
                  <th>Deposito</th>
                  <th>Planejado</th>
                  <th>Produzido</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {production.orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>{order.code}</td>
                    <td>{order.product.name}</td>
                    <td>{order.warehouse.name}</td>
                    <td>{formatQuantity(order.quantityPlanned)}</td>
                    <td>{formatQuantity(order.quantityProduced)}</td>
                    <td><StatusBadge value={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </SectionCard>
        </div>

        <div className="span-5">
          <SectionCard eyebrow="Engenharia" title="Estruturas BOM" description="Leitura tecnica das estruturas cadastradas." compact>
            <div className="stack">
              {production.boms.map((bom: any) => (
                <div key={bom.id} className="task-row">
                  <div>
                    <strong>{bom.code} v{bom.version}</strong>
                    <p>{bom.product.name}</p>
                  </div>
                  <div className="align-right">
                    <span>{bom.items.map((item: any) => `${item.component.name} (${formatQuantity(item.quantity)})`).join(", ")}</span>
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
