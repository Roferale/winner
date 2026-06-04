import { DEMO } from "./demo-data";

export type DecimalLike = string | number;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return response.json();
  } catch {
    return fallback;
  }
}

export const formatCurrency = (value: DecimalLike) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export const formatQuantity = (value: DecimalLike) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(Number(value));

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));

export async function getMasterData() {
  return fetchJson<any>("/demo/master-data", {
    company: DEMO.company,
    products: DEMO.products,
    customers: DEMO.customers,
    suppliers: DEMO.suppliers,
    warehouses: DEMO.warehouses,
    costCenters: DEMO.costCenters,
    taxRules: DEMO.taxRules,
    people: DEMO.people,
  });
}

export async function getOverview() {
  return fetchJson<any>("/demo/overview", {
    summary: DEMO.summary,
    entries: DEMO.entries,
    agingReceivable: DEMO.agingReceivable,
    agingPayable: DEMO.agingPayable,
    alunos: DEMO.alunos,
  });
}

export async function getFinancialControl() {
  return fetchJson<any>("/demo/financial-control", {
    summary: DEMO.summary,
    entries: DEMO.entries,
    agingReceivable: DEMO.agingReceivable,
    agingPayable: DEMO.agingPayable,
  });
}

export async function getFinance() {
  return fetchJson<any>("/demo/finance", {
    summary: DEMO.summary,
    entries: DEMO.entries,
    agingReceivable: DEMO.agingReceivable,
    agingPayable: DEMO.agingPayable,
  });
}

export async function getCommercial() {
  return fetchJson<any>("/demo/commercial", DEMO.orders);
}

export async function getPurchases() {
  return fetchJson<any>("/demo/purchases", DEMO.purchaseOrders);
}

export async function getFiscal() {
  return fetchJson<any>("/demo/fiscal", {
    invoices: DEMO.invoices,
    taxRules: DEMO.taxRules,
    certificates: DEMO.certificates,
  });
}

export async function getInventory() {
  return fetchJson<any>("/demo/inventory", {
    balances: DEMO.balances,
    movements: DEMO.movements,
  });
}

export async function getProduction() {
  return fetchJson<any>("/demo/production", {
    orders: DEMO.productionOrders,
    boms: DEMO.boms,
    products: DEMO.products,
    warehouses: DEMO.warehouses,
  });
}

export async function getPeople() {
  return fetchJson<any>("/demo/people", {
    people: DEMO.people,
    products: DEMO.products,
    warehouses: DEMO.warehouses,
    costCenters: DEMO.costCenters,
    taxRules: DEMO.taxRules,
  });
}

export async function getAlunos() {
  return fetchJson<any>("/demo/alunos", {
    alunos: DEMO.alunos,
    totals: {
      totalAlunos: DEMO.alunos.length,
      comAcesso: DEMO.alunos.filter((a: any) => a.hasPortalAccess).length,
      semAcesso: DEMO.alunos.filter((a: any) => !a.hasPortalAccess).length,
    },
  });
}

export async function getGovernance() {
  return fetchJson<any>("/demo/governance", {
    tasks: DEMO.tasks,
    auditLogs: DEMO.auditLogs,
  });
}

export async function getBi() {
  return fetchJson<any>("/demo/bi", {
    kpis: DEMO.kpis,
    dre: DEMO.dre,
    topInventory: DEMO.topInventory,
  });
}

export async function getAulas() {
  return fetchJson<any>("/demo/aulas", {
    turmas: DEMO.turmas,
    agendamentos: DEMO.agendamentos,
    totalVagas: DEMO.totalVagas,
    totalMatriculados: DEMO.totalMatriculados,
    shareUrl: DEMO.shareUrl,
  });
}

export async function getQuadras() {
  return fetchJson<any>("/demo/quadras", {
    quadras: DEMO.quadras,
    agendaHoje: DEMO.agendaHoje,
  });
}

export async function getTorneios() {
  return fetchJson<any>("/demo/torneios", {
    torneios: DEMO.torneios,
  });
}
