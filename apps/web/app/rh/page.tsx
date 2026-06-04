import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { getMasterData } from "../lib/erp";

export default async function RhPage() {
  const master = await getMasterData();

  return (
    <ErpShell currentPath="/rh" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="RH"
        title="Base estrutural do RH"
        description="Modulo em evolucao, com linguagem profissional e roadmap claro para folha, ponto e beneficios."
      />

      <section className="workspace-grid">
        <div className="span-7">
          <SectionCard eyebrow="Estrutura" title="Base de pessoas e futura folha" description="Camada inicial para admissao, ponto, eventos e integracao contabil futura.">
            <div className="stack">
              <div className="task-row"><div><strong>Cadastro de funcionarios</strong><p>Base pronta para vinculo contratual e centro de custo.</p></div><span>Ativo</span></div>
              <div className="task-row"><div><strong>Controle de ponto</strong><p>Planejado para jornadas, banco de horas e marcacoes.</p></div><span>Roadmap</span></div>
              <div className="task-row"><div><strong>Folha e beneficios</strong><p>Base estrutural pronta para eventos, calculo e beneficios.</p></div><span>Backlog</span></div>
            </div>
          </SectionCard>
        </div>

        <div className="span-5">
          <SectionCard eyebrow="Pessoas relacionadas" title="Entidades da base" description="Pessoas que ja podem ser aproveitadas pelo modulo." compact>
            <div className="stack">
              {master.customers.concat(master.suppliers).map((person: any) => (
                <div key={person.id} className="list-row">
                  <div>
                    <strong>{person.legalName}</strong>
                    <p>{person.document}</p>
                  </div>
                  <div className="align-right">
                    <span>{person.kinds.join(", ")}</span>
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
