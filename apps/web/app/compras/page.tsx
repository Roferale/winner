import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { FilterBar } from "../components/filter-bar";
import { PurchaseOrderForm } from "../components/forms";
import { LaunchCard } from "../components/launch-card";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatusBadge } from "../components/status-badge";
import { formatCurrency, formatQuantity, getMasterData, getPurchases } from "../lib/erp";

export default async function ComprasPage() {
  const [orders, master] = await Promise.all([getPurchases(), getMasterData()]);

  return (
    <ErpShell currentPath="/compras" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Compras"
        title="Recebimento e suprimentos"
        description="Tela organizada para cabeçalho do documento, item recebido, reflexo fiscal e financeiro."
      />

      <FilterBar
        items={[
          { label: "Fornecedores", value: `${master.suppliers.length} ativos` },
          { label: "Historico", value: `${orders.length} compras` },
          { label: "Deposito", value: master.warehouses[0]?.name ?? "-" }
        ]}
      />

      <section className="workspace-grid">
        <div className="span-5">
          <LaunchCard title="Receber compra" description="Entrada controlada de suprimentos com criacao automatica de financeiro.">
            <PurchaseOrderForm
              companyId={master.company.id}
              suppliers={master.suppliers}
              costCenters={master.costCenters}
              taxRules={master.taxRules}
              warehouses={master.warehouses}
              products={master.products}
            />
          </LaunchCard>
        </div>

        <div className="span-7">
          <SectionCard eyebrow="Historico" title="Compras registradas" description="Leitura por fornecedor, itens, situacao do documento e valor.">
            <DataTable>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fornecedor</th>
                  <th>Itens</th>
                  <th>Documento</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td><strong>{order.code}</strong><span className="cell-subtitle">{order.issueDate.slice(0, 10)}</span></td>
                    <td>{order.supplier.legalName}</td>
                    <td>{order.items.map((item: any) => `${item.product.name} (${formatQuantity(item.quantity)})`).join(", ")}</td>
                    <td>{order.invoice ? order.invoice.number : "Sem NF"}</td>
                    <td><StatusBadge value={order.status} /></td>
                    <td>{formatCurrency(order.totalNet)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </SectionCard>
        </div>
      </section>
    </ErpShell>
  );
}
