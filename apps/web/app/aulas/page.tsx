import { GraduationCap, Users, Share2 } from "lucide-react";
import { DataTable } from "../components/data-table";
import { ErpShell } from "../components/erp-shell";
import { PageHeader } from "../components/page-header";
import { SectionCard } from "../components/section-card";
import { StatCard } from "../components/stat-card";
import { getAulas, getMasterData } from "../lib/erp";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace(":3001", ":3000") ?? "http://localhost:3000";

const NIVEL_COLOR: Record<string, string> = {
  Iniciante:    "var(--success)",
  Intermediario:"var(--primary)",
  Avancado:     "var(--warning)"
};

async function getAgendamentos() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/demo/aulas/agendamentos`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function AulasPage() {
  const [data, master, agendamentos] = await Promise.all([
    getAulas(), getMasterData(), getAgendamentos()
  ]);

  const ocupacao = data.totalVagas > 0
    ? Math.round((data.totalMatriculados / data.totalVagas) * 100)
    : 0;

  const bookingUrl = `${WEB_URL}/agendar`;
  const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(bookingUrl)}&bgcolor=ffffff&color=178014`;
  const waUrl      = `https://wa.me/?text=${encodeURIComponent(`Agende sua aula na Winner Academia 🎾\n${bookingUrl}`)}`;

  return (
    <ErpShell currentPath="/aulas" companyName={master.company.tradeName} companyCnpj={master.company.cnpj}>
      <PageHeader
        eyebrow="Academia"
        title="Aulas e Turmas"
        description="Turmas ativas, ocupação e agendamentos do dia."
        right={
          <>
            <div className="pill">{data.turmas.length} turmas</div>
            <div className="pill emphasis">{ocupacao}% ocupação</div>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <StatCard label="Turmas ativas"       value={String(data.turmas.length)}      detail="Em andamento"                                icon={<GraduationCap size={18} />} />
        <StatCard label="Agendados hoje"       value={String(data.totalMatriculados)}  detail={`de ${data.totalVagas} vagas totais`}        icon={<Users size={18} />} />
        <StatCard label="Total agendamentos"   value={String(agendamentos.length)}     detail="Histórico completo"                          icon={<Users size={18} />} />
      </div>

      {/* Share card */}
      <div className="section-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 28 }}>
        {/* QR Code */}
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR Code agendamento" width={120} height={120}
               style={{ borderRadius: 8, display: "block" }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Share2 size={15} style={{ color: "var(--primary)" }} />
            <strong style={{ fontSize: 14 }}>Link de agendamento para alunos</strong>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-soft)" }}>
            Compartilhe o QR code ou o link abaixo. O aluno acessa, informa o CPF e confirma a vaga.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "var(--text)" }}>
              {bookingUrl}
            </code>
            <a href={waUrl} target="_blank" rel="noreferrer"
               style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#25D366", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Grade de turmas */}
      <SectionCard eyebrow="Turmas" title="Grade de aulas" description="Todas as turmas com horário, professor, nível e vagas de hoje.">
        <DataTable>
          <thead>
            <tr>
              <th>Código</th>
              <th>Turma</th>
              <th>Nível</th>
              <th>Professor</th>
              <th>Horário</th>
              <th>Superfície</th>
              <th>Hoje</th>
              <th>Ocupação</th>
            </tr>
          </thead>
          <tbody>
            {data.turmas.map((t: any) => {
              const pct = Math.round((t.agendadosHoje / t.vagas) * 100);
              return (
                <tr key={t.codigo}>
                  <td><span className="pill">{t.codigo}</span></td>
                  <td><strong>{t.nome}</strong></td>
                  <td>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: (NIVEL_COLOR[t.nivel] ?? "var(--primary)") + "22", color: NIVEL_COLOR[t.nivel] ?? "var(--primary)" }}>
                      {t.nivel}
                    </span>
                  </td>
                  <td>{t.professor}</td>
                  <td>{t.horario}</td>
                  <td>{t.surface}</td>
                  <td>{t.agendadosHoje}/{t.vagas}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--surface-soft)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--warning)" : "var(--success)", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-soft)", minWidth: 32 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </SectionCard>

      {/* Agendamentos recentes */}
      {agendamentos.length > 0 && (
        <SectionCard eyebrow="Agendamentos" title="Histórico de agendamentos" description="Todos os agendamentos feitos pelos alunos.">
          <DataTable>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>CPF</th>
                <th>Turma</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.slice(0, 50).map((b: any) => (
                <tr key={b.id}>
                  <td><strong>{b.personName}</strong></td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{b.personDocument}</td>
                  <td>{b.classSchedule?.name ?? b.classScheduleId}</td>
                  <td>{new Date(b.date).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <span className={`status-badge ${b.status === "CONFIRMED" ? "status-success" : b.status === "ATTENDED" ? "status-info" : "status-neutral"}`}>
                      {b.status === "CONFIRMED" ? "Confirmado" : b.status === "ATTENDED" ? "Presente" : "Cancelado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </SectionCard>
      )}
    </ErpShell>
  );
}
