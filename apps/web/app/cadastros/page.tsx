import { DataTable } from "../components/data-table";
import {
  CostCenterForm,
  CustomerForm,
  ProductForm,
  SupplierForm,
  TaxRuleForm,
  WarehouseForm
} from "../components/forms";
import { ErpShell } from "../components/erp-shell";
import { FilterBar } from "../components/filter-bar";
import { LaunchCard } from "../components/launch-card";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { getMasterData, getPeople } from "../lib/erp";

export default async function CadastrosPage() {
  const [peopleData, master] = await Promise.all([getPeople(), getMasterData()]);

  return (
    <ErpShell currentPath="/cadastros" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Cadastros"
        title="Base mestra operacional"
        description="Cadastre produtos, clientes, fornecedores, depositos, centros de custo e regras fiscais diretamente pela interface."
      />

      <FilterBar
        items={[
          { label: "Pessoas", value: `${peopleData.people.length}` },
          { label: "Produtos", value: `${master.products.length}` },
          { label: "Regras fiscais", value: `${master.taxRules.length}` }
        ]}
      />

      <section className="workspace-grid">
        <div className="span-6">
          <LaunchCard title="Novo produto" description="Cria item mestre para compras, vendas, estoque e producao.">
            <ProductForm companyId={master.company.id} taxRules={master.taxRules} />
          </LaunchCard>
        </div>
        <div className="span-6">
          <LaunchCard title="Novo cliente" description="Cadastro comercial usado em pedido, fiscal e contas a receber.">
            <CustomerForm companyId={master.company.id} />
          </LaunchCard>
        </div>
        <div className="span-6">
          <LaunchCard title="Novo fornecedor" description="Cadastro de suprimentos integrado ao fiscal e contas a pagar.">
            <SupplierForm companyId={master.company.id} />
          </LaunchCard>
        </div>
        <div className="span-6">
          <LaunchCard title="Novo deposito" description="Estrutura de armazenagem para saldo, compra, venda e producao.">
            <WarehouseForm companyId={master.company.id} />
          </LaunchCard>
        </div>
        <div className="span-6">
          <LaunchCard title="Novo centro de custo" description="Base financeira para DRE, compras e comercial.">
            <CostCenterForm companyId={master.company.id} />
          </LaunchCard>
        </div>
        <div className="span-6">
          <LaunchCard title="Nova regra fiscal" description="Padrao tributario reutilizado em documentos de compra e venda.">
            <TaxRuleForm companyId={master.company.id} />
          </LaunchCard>
        </div>

        <div className="span-8">
          <SectionCard eyebrow="Pessoas" title="Clientes, fornecedores e colaboradores" description="A listagem e atualizada automaticamente apos cada cadastro.">
            <DataTable>
              <thead><tr><th>Nome</th><th>Documento</th><th>Cidade</th><th>Perfis</th></tr></thead>
              <tbody>
                {peopleData.people.map((person: any) => (
                  <tr key={person.id}>
                    <td>{person.legalName}</td>
                    <td>{person.document}</td>
                    <td>{person.city ?? "-"}/{person.state ?? "-"}</td>
                    <td>{person.kinds.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </SectionCard>
        </div>

        <div className="span-4">
          <SectionCard eyebrow="Produtos" title="Catalogo" description="Itens mestre com tipo, SKU, unidade e preco." compact>
            <div className="stack">
              {master.products.map((product: any) => (
                <div key={product.id} className="list-row">
                  <div>
                    <strong>{product.sku}</strong>
                    <p>{product.name}</p>
                  </div>
                  <div className="align-right">
                    <span>{product.type}</span>
                    <small>{product.unit}</small>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard eyebrow="Infraestrutura" title="Depositos, centros e regras fiscais" description="A base mestre alimenta o restante do ERP.">
            <div className="triple-grid">
              <div className="stack">
                {master.warehouses.map((warehouse: any) => (
                  <div key={warehouse.id} className="task-row">
                    <div>
                      <strong>{warehouse.code}</strong>
                      <p>{warehouse.name}</p>
                    </div>
                    <span>Deposito</span>
                  </div>
                ))}
              </div>
              <div className="stack">
                {master.costCenters.map((center: any) => (
                  <div key={center.id} className="task-row">
                    <div>
                      <strong>{center.code}</strong>
                      <p>{center.name}</p>
                    </div>
                    <span>{center.dreGroup}</span>
                  </div>
                ))}
              </div>
              <div className="stack">
                {master.taxRules.map((rule: any) => (
                  <div key={rule.id} className="task-row">
                    <div>
                      <strong>{rule.code}</strong>
                      <p>{rule.name}</p>
                    </div>
                    <span>{rule.operationType}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </ErpShell>
  );
}
