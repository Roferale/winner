import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { FilterBar } from "../components/filter-bar";
import { SalesOrderForm } from "../components/forms";
import { LaunchCard } from "../components/launch-card";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatusBadge } from "../components/status-badge";
import { formatCurrency, formatQuantity, getCommercial, getMasterData } from "../lib/erp";

export default async function ComercialPage() {
  const [orders, master] = await Promise.all([getCommercial(), getMasterData()]);

  return (
    <ErpShell currentPath="/comercial" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Comercial"
        title="Fluxo de pedidos"
        description="Cadastro, faturamento e rastreabilidade do pedido com reflexo em fiscal, estoque e financeiro."
      />

      <FilterBar
        items={[
          { label: "Carteira", value: `${orders.length} pedidos` },
          { label: "Clientes", value: `${master.customers.length} cadastrados` },
          { label: "Tabela fiscal", value: master.taxRules.find((item: any) => item.operationType === "SALE")?.code ?? "-" }
        ]}
      />

      <section className="workspace-grid">
        <div className="span-5">
          <LaunchCard title="Novo pedido faturado" description="Fluxo enxuto para emissao direta de pedido com nota e contas a receber.">
            <SalesOrderForm
              companyId={master.company.id}
              customers={master.customers}
              costCenters={master.costCenters}
              taxRules={master.taxRules}
              warehouses={master.warehouses}
              products={master.products}
            />
          </LaunchCard>
        </div>

        <div className="span-7">
          <SectionCard eyebrow="Carteira" title="Pedidos emitidos" description="Listagem comercial com foco em escaneabilidade e tomada de decisao.">
            <DataTable>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Pagamento</th>
                  <th>NF</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.code}</strong>
                      <span className="cell-subtitle">{order.salesRep ?? "Sem vendedor"}</span>
                    </td>
                    <td>{order.customer.legalName}</td>
                    <td>{order.items.map((item: any) => `${item.product.name} (${formatQuantity(item.quantity)})`).join(", ")}</td>
                    <td>{order.paymentTerms}</td>
                    <td>{order.invoice ? order.invoice.number : "Pendente"}</td>
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
