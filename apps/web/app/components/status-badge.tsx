const CONFIG: Record<string, { label: string; tone: string }> = {
  // Status financeiro
  OPEN:              { label: "Em aberto",      tone: "warning"  },
  OVERDUE:           { label: "Vencido",         tone: "danger"   },
  SETTLED:           { label: "Pago",            tone: "success"  },
  PARTIALLY_SETTLED: { label: "Parcial",         tone: "info"     },
  CANCELLED:         { label: "Cancelado",       tone: "neutral"  },
  // Documentos
  DRAFT:             { label: "Rascunho",        tone: "neutral"  },
  PENDING:           { label: "Pendente",        tone: "warning"  },
  APPROVED:          { label: "Aprovado",        tone: "success"  },
  ISSUED:            { label: "Emitido",         tone: "info"     },
  AUTHORIZED:        { label: "Autorizado",      tone: "success"  },
  REJECTED:          { label: "Rejeitado",       tone: "danger"   },
  CLOSED:            { label: "Encerrado",       tone: "neutral"  },
  // Direção financeira
  PAYABLE:           { label: "A pagar",         tone: "danger"   },
  RECEIVABLE:        { label: "A receber",       tone: "success"  },
  // Produção
  IN_PROGRESS:       { label: "Em andamento",    tone: "info"     },
  PLANNED:           { label: "Planejado",       tone: "neutral"  },
  RELEASED:          { label: "Liberado",        tone: "warning"  },
  FINISHED:          { label: "Concluído",       tone: "success"  },
  // Tasks
  OPEN_TASK:         { label: "Aberta",          tone: "warning"  },
  DONE:              { label: "Concluída",       tone: "success"  },
  // Ambiente
  HOMOLOG:           { label: "Homologação",     tone: "info"     },
  PRODUCTION:        { label: "Produção",        tone: "success"  },
  // Extrato / import
  BANK_IMPORT:       { label: "Extrato",         tone: "info"     },
  MANUAL:            { label: "Manual",          tone: "neutral"  },
  // Agendamento
  CONFIRMED:         { label: "Confirmado",      tone: "success"  },
  ATTENDED:          { label: "Presente",        tone: "info"     },
};

export function StatusBadge({ value }: { value: string }) {
  const cfg  = CONFIG[value];
  const tone = cfg?.tone ?? "neutral";
  const text = cfg?.label ?? value.replaceAll("_", " ");
  return <span className={`status-badge status-${tone}`}>{text}</span>;
}
