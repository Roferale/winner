import { AuditTimeline } from "../components/audit-timeline";
import { ErpShell } from "../components/erp-shell";
import { TaskForm } from "../components/forms";
import { LaunchCard } from "../components/launch-card";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatusBadge } from "../components/status-badge";
import { formatDate, getGovernance, getMasterData } from "../lib/erp";

export default async function GovernancaPage() {
  const [governance, master] = await Promise.all([getGovernance(), getMasterData()]);

  return (
    <ErpShell currentPath="/governanca" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Governanca"
        title="SLA, auditoria e tarefas"
        description="Workflow interno mais profissional para gestao de tarefas, prazos e rastreabilidade operacional."
      />

      <section className="workspace-grid">
        <div className="span-5">
          <LaunchCard title="Abrir tarefa interna" description="Crie chamadas de backoffice com modulo, SLA e responsavel definidos.">
            <TaskForm companyId={master.company.id} />
          </LaunchCard>
        </div>

        <div className="span-7">
          <SectionCard eyebrow="SLA" title="Tarefas abertas" description="Priorizacao por modulo, responsavel, situacao e prazo.">
            <div className="stack">
              {governance.tasks.map((task: any) => (
                <div key={task.id} className="task-row">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.module} • {task.assignee ?? "Sem responsavel"}</p>
                  </div>
                  <div className="align-right">
                    <span>{formatDate(task.dueAt)}</span>
                    <small><StatusBadge value={task.status} /></small>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="span-12">
          <SectionCard eyebrow="Auditoria" title="Timeline de eventos" description="Historico de eventos do ERP com leitura mais executiva e confiavel.">
            <AuditTimeline
              items={governance.auditLogs.map((item: any) => ({
                id: item.id,
                entity: item.entity,
                action: item.action,
                createdAt: item.createdAt
              }))}
            />
          </SectionCard>
        </div>
      </section>
    </ErpShell>
  );
}
