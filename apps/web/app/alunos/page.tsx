import { UsersRound, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { CobrarButton } from "../components/cobrar-button";
import { DataTable } from "../components/data-table";
import { EmptyState } from "../components/empty-state";
import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatCard } from "../components/stat-card";
import { formatCurrency, getAlunos, getMasterData } from "../lib/erp";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace(":3001", ":3000") ?? "http://localhost:3000";

function PortalStatus({ hasAccess, firstAccess }: { hasAccess: boolean; firstAccess: boolean }) {
  if (hasAccess)    return <span className="status-badge status-success"><CheckCircle size={11} /> Ativo</span>;
  if (!firstAccess) return <span className="status-badge status-warning"><Clock size={11} /> Pendente</span>;
  return <span className="status-badge status-neutral"><AlertCircle size={11} /> Sem acesso</span>;
}

export default async function AlunosPage() {
  const [data, master] = await Promise.all([getAlunos(), getMasterData()]);

  const comAcesso   = data.alunos.filter((a: any) => a.hasPortalAccess).length;
  const semAcesso   = data.alunos.filter((a: any) => !a.hasPortalAccess).length;

  return (
    <ErpShell currentPath="/alunos" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Alunos"
        title="Gestão de alunos"
        description="Cadastro, acesso ao portal e situação financeira de cada aluno."
        right={
          <>
            <div className="pill">{data.totals.totalAlunos} alunos</div>
            <div className="pill emphasis">{comAcesso} com portal ativo</div>
          </>
        }
      />

      <div className="kpi-grid"  >
        <StatCard
          label="Total de alunos"
          value={String(data.totals.totalAlunos)}
          detail="Cadastrados no sistema"
          icon={<UsersRound size={15} />}
          accent="primary"
        />
        <StatCard
          label="Portal ativo"
          value={String(comAcesso)}
          detail="Acessam o portal de pagamento"
          icon={<CheckCircle size={15} />}
          accent="success"
        />
        <StatCard
          label="Sem portal"
          value={String(semAcesso)}
          detail="Sem acesso ao portal habilitado"
          icon={<AlertCircle size={15} />}
          accent={semAcesso > 0 ? "warning" : "success"}
        />
      </div>

      <SectionCard
        eyebrow="Cadastro"
        title="Alunos"
        description="Status de acesso ao portal de pagamentos de cada aluno."
      >
        {data.alunos.length === 0 ? (
          <EmptyState title="Nenhum aluno cadastrado" description="Adicione alunos via Cadastros para vê-los aqui." />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Cidade</th>
                <th>Portal</th>
                <th>Portal</th>
              </tr>
            </thead>
            <tbody>
              {data.alunos.map((aluno: any) => (
                <tr key={aluno.id}>
                  <td>
                    <strong>{aluno.name}</strong>
                    {aluno.email && <span className="cell-subtitle">{aluno.email}</span>}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>
                    {aluno.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                  </td>
                  <td>{aluno.city ? `${aluno.city}/${aluno.state}` : "—"}</td>
                  <td>
                    <PortalStatus hasAccess={aluno.hasPortalAccess} firstAccess={aluno.firstAccess} />
                  </td>
                  <td>
                    {aluno.hasPortalAccess ? (
                      <a
                        href={`${WEB_URL}/cliente`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}
                      >
                        Abrir portal ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>Sem acesso</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </SectionCard>
    </ErpShell>
  );
}
