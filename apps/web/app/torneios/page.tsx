import { Trophy, CalendarDays, Users } from "lucide-react";
import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatCard } from "../components/stat-card";
import { getTorneios, getMasterData, formatDate } from "../lib/erp";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "Inscricoes abertas":    { bg: "var(--success-soft)",  color: "var(--success)" },
  "Inscricoes encerradas": { bg: "var(--surface-soft)",  color: "var(--text-soft)" },
  "Em andamento":          { bg: "var(--primary-soft)",  color: "var(--primary-dark)" },
  "Encerrado":             { bg: "var(--surface-soft)",  color: "var(--text-faint)" }
};

export default async function TorneiosPage() {
  const [data, master] = await Promise.all([getTorneios(), getMasterData()]);

  const ativos     = data.torneios.filter((t: any) => t.status === "Em andamento").length;
  const abertos    = data.torneios.filter((t: any) => t.status === "Inscricoes abertas").length;
  const totalInscritos = data.torneios.reduce((s: number, t: any) => s + t.inscricoes, 0);

  return (
    <ErpShell currentPath="/torneios" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Academia"
        title="Torneios"
        description="Calendário de torneios internos e externos, inscrições e status."
        right={
          <>
            <div className="pill">{data.torneios.length} torneios</div>
            {ativos > 0    && <div className="pill emphasis">{ativos} em andamento</div>}
            {abertos > 0   && <div className="pill">{abertos} com inscrições abertas</div>}
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Torneios"      value={String(data.torneios.length)} detail="No calendário"      icon={<Trophy size={18} />} />
        <StatCard label="Em andamento"  value={String(ativos)}               detail="Rodadas em curso"   icon={<CalendarDays size={18} />} />
        <StatCard label="Inscritos"     value={String(totalInscritos)}       detail="Total em todos"     icon={<Users size={18} />} />
      </div>

      <SectionCard
        eyebrow="Calendário"
        title="Torneios da temporada"
        description="Todos os torneios com categoria, formato, inscrições e status."
      >
        <DataTable>
          <thead>
            <tr>
              <th>Código</th>
              <th>Torneio</th>
              <th>Categoria</th>
              <th>Superfície</th>
              <th>Período</th>
              <th>Formato</th>
              <th>Inscrições</th>
              <th>Premiação</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.torneios.map((t: any) => {
              const style = STATUS_STYLE[t.status] ?? STATUS_STYLE["Encerrado"];
              const pct = Math.round((t.inscricoes / t.maxInscricoes) * 100);
              return (
                <tr key={t.codigo}>
                  <td><span className="pill">{t.codigo}</span></td>
                  <td><strong>{t.nome}</strong></td>
                  <td>{t.categoria}</td>
                  <td><span className="pill">{t.superficie}</span></td>
                  <td>
                    <span style={{ fontSize: 13 }}>
                      {formatDate(t.dataInicio)} — {formatDate(t.dataFim)}
                    </span>
                  </td>
                  <td>{t.formato}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{t.inscricoes}/{t.maxInscricoes}</span>
                      <div style={{ width: 48, height: 5, borderRadius: 999, background: "var(--surface-soft)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : "var(--primary)", borderRadius: 999 }} />
                      </div>
                    </div>
                  </td>
                  <td>{t.premiacao}</td>
                  <td>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: style.bg, color: style.color }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </SectionCard>
    </ErpShell>
  );
}
