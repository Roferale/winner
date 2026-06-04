import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatusBadge } from "../components/status-badge";
import { formatCurrency, getFiscal, getMasterData } from "../lib/erp";

export default async function FiscalPage() {
  const [fiscal, master] = await Promise.all([getFiscal(), getMasterData()]);

  return (
    <ErpShell currentPath="/fiscal" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Fiscal"
        title="Notas e tributacao"
        description="Organizacao sobria para transmitir seguranca, rastreabilidade e preparo para integracoes fiscais."
      />

      <section className="workspace-grid">
        <div className="span-8">
          <SectionCard eyebrow="Documentos" title="NF-e emitidas" description="Numero, serie, natureza e total em leitura direta para backoffice fiscal.">
            <DataTable>
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Serie</th>
                  <th>Modelo</th>
                  <th>Natureza</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {fiscal.invoices.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td>{invoice.number}</td>
                    <td>{invoice.series}</td>
                    <td>{invoice.model}</td>
                    <td>{invoice.operationNature}</td>
                    <td><StatusBadge value={invoice.status} /></td>
                    <td>{formatCurrency(invoice.totalInvoice)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </SectionCard>
        </div>

        <div className="span-4">
          <SectionCard eyebrow="Configuracao" title="Regras fiscais e certificados" description="Base organizada para evoluir XML, DANFE e obrigacoes acessorias." compact>
            <div className="stack">
              {fiscal.taxRules.map((rule: any) => (
                <div key={rule.id} className="task-row">
                  <div>
                    <strong>{rule.code}</strong>
                    <p>{rule.name}</p>
                  </div>
                  <span><StatusBadge value={rule.operationType} /></span>
                </div>
              ))}
              {fiscal.certificates.map((certificate: any) => (
                <div key={certificate.id} className="task-row">
                  <div>
                    <strong>{certificate.name}</strong>
                    <p>Valido ate {new Date(certificate.validUntil).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span><StatusBadge value={certificate.environment} /></span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </ErpShell>
  );
}
