import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { FilterBar } from "../components/filter-bar";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatusBadge } from "../components/status-badge";
import { formatCurrency, formatDate, formatQuantity, getInventory, getMasterData } from "../lib/erp";

export default async function EstoquePage() {
  const [inventory, master] = await Promise.all([getInventory(), getMasterData()]);

  return (
    <ErpShell currentPath="/estoque" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Estoque"
        title="Posicao e extrato"
        description="Leitura rapida de saldo, unidade, custo medio, deposito e movimentos operacionais."
      />

      <FilterBar
        items={[
          { label: "Deposito", value: master.warehouses[0]?.name ?? "-" },
          { label: "SKUs", value: `${master.products.length}` },
          { label: "Movimentos", value: `${inventory.movements.length} recentes` }
        ]}
      />

      <section className="workspace-grid">
        <div className="span-7">
          <SectionCard eyebrow="Saldo atual" title="Posicao por deposito" description="Tabela enxuta com saldo, unidade e custo medio.">
            <DataTable>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Deposito</th>
                  <th>Saldo</th>
                  <th>Unidade</th>
                  <th>Custo medio</th>
                </tr>
              </thead>
              <tbody>
                {inventory.balances.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.product.sku}</td>
                    <td>{item.product.name}</td>
                    <td>{item.warehouse.name}</td>
                    <td>{formatQuantity(item.quantity)}</td>
                    <td>{item.product.unit}</td>
                    <td>{formatCurrency(item.averageCost)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </SectionCard>
        </div>

        <div className="span-5">
          <SectionCard eyebrow="Extrato" title="Movimentacoes recentes" description="Entradas, saidas, consumo e producao com destaque visual." compact>
            <DataTable dense>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Qtde</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                {inventory.movements.map((movement: any) => (
                  <tr key={movement.id}>
                    <td>{formatDate(movement.occurredAt)}</td>
                    <td><StatusBadge value={movement.type} /></td>
                    <td>{movement.product.name}</td>
                    <td>{formatQuantity(movement.quantity)}</td>
                    <td>{formatCurrency(movement.unitCost)}</td>
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
