import { Grid3x3, Clock } from "lucide-react";
import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatCard } from "../components/stat-card";
import { getQuadras, getMasterData } from "../lib/erp";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Disponivel:  { bg: "var(--success-soft)",  color: "var(--success)" },
  Ocupada:     { bg: "var(--primary-soft)",   color: "var(--primary-dark)" },
  Manutencao:  { bg: "var(--warning-soft)",   color: "var(--warning)" }
};

export default async function QuadrasPage() {
  const [data, master] = await Promise.all([getQuadras(), getMasterData()]);

  const disponiveis = data.quadras.filter((q: any) => q.status === "Disponivel").length;
  const ocupadas    = data.quadras.filter((q: any) => q.status === "Ocupada").length;
  const manutencao  = data.quadras.filter((q: any) => q.status === "Manutencao").length;

  return (
    <ErpShell currentPath="/quadras" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Academia"
        title="Quadras"
        description="Status em tempo real das quadras e agenda do dia."
        right={
          <>
            <div className="pill">{data.quadras.length} quadras</div>
            <div className="pill emphasis">{disponiveis} disponíveis</div>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Disponíveis"  value={String(disponiveis)} detail="Prontas para uso"       icon={<Grid3x3 size={18} />} />
        <StatCard label="Ocupadas"     value={String(ocupadas)}    detail="Em uso agora"           icon={<Grid3x3 size={18} />} />
        <StatCard label="Manutenção"   value={String(manutencao)}  detail="Temporariamente fora"  icon={<Grid3x3 size={18} />} />
      </div>

      <SectionCard eyebrow="Quadras" title="Status das quadras" description="Visão geral de cada quadra com superfície, status e próxima reserva.">
        <DataTable>
          <thead>
            <tr>
              <th>Quadra</th>
              <th>Superfície</th>
              <th>Status</th>
              <th>Uso atual</th>
              <th>Próxima reserva</th>
            </tr>
          </thead>
          <tbody>
            {data.quadras.map((q: any) => {
              const style = STATUS_STYLE[q.status] ?? STATUS_STYLE.Disponivel;
              return (
                <tr key={q.numero}>
                  <td><strong>{q.nome}</strong></td>
                  <td><span className="pill">{q.superficie}</span></td>
                  <td>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: style.bg, color: style.color }}>
                      {q.status}
                    </span>
                  </td>
                  <td>{q.reservaAtual ?? <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                  <td>{q.proximaReserva ?? <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </SectionCard>

      <SectionCard eyebrow="Agenda" title="Programação do dia" description="Todas as aulas e reservas agendadas para hoje.">
        <DataTable>
          <thead>
            <tr>
              <th>Horário</th>
              <th>Quadra</th>
              <th>Turma / Evento</th>
              <th>Professor</th>
              <th>Vagas</th>
            </tr>
          </thead>
          <tbody>
            {data.agendaHoje.map((a: any, i: number) => (
              <tr key={i}>
                <td>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                    <Clock size={13} style={{ color: "var(--primary)" }} />
                    {a.horario}
                  </span>
                </td>
                <td>{a.quadra}</td>
                <td><strong>{a.turma}</strong></td>
                <td>{a.professor}</td>
                <td>{a.vagas} vagas</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </SectionCard>
    </ErpShell>
  );
}
