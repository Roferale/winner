export type DecimalLike = string | number;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchJson<T>(path: string, fallback: T = {} as T): Promise<T> {
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
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));

const EMPTY_LIST = { items: [], entries: [], orders: [], people: [], products: [], warehouses: [], costCenters: [], taxRules: [], invoices: [], balances: [], movements: [], tasks: [], auditLogs: [], students: [], classes: [], bookings: [], courts: [], tournaments: [], boms: [] };

export async function getOverview() {
  return fetchJson<any>("/demo/overview", { receivable: 0, payable: 0, overdue: 0, netBalance: 0, entries: [], students: [] });
}

export async function getMasterData() {
  return fetchJson<any>("/demo/master-data", { company: { id: "demo", tradeName: "Winner Academia", cnpj: "12345678000199" }, products: [], customers: [], suppliers: [], warehouses: [], costCenters: [], taxRules: [], people: [] });
}

export async function getCommercial() {
  return fetchJson<any>("/demo/commercial", []);
}

export async function getPurchases() {
  return fetchJson<any>("/demo/purchases", []);
}

export async function getFinance() {
  return fetchJson<any>("/demo/finance", { receivable: 0, payable: 0, overdue: 0, netBalance: 0, entries: [], aging: [] });
}

export async function getFinancialControl() {
  return fetchJson<any>("/demo/financial-control", { summary: { totalReceivable: 0, totalPayable: 0, overdueReceivable: 0, overduePayable: 0, netBalance: 0 }, entries: [], agingReceivable: [], agingPayable: [] });
}

export async function getAlunos() {
  return fetchJson<any>("/demo/alunos", { alunos: [], totals: { totalAlunos: 0, comAcesso: 0, semAcesso: 0 } });
}

export async function getFiscal() {
  return fetchJson<any>("/demo/fiscal", { invoices: [], taxRules: [], certificates: [] });
}

export async function getInventory() {
  return fetchJson<any>("/demo/inventory", { balances: [], movements: [] });
}

export async function getProduction() {
  return fetchJson<any>("/demo/production", { orders: [], boms: [], products: [], warehouses: [] });
}

export async function getPeople() {
  return fetchJson<any>("/demo/people", { people: [], products: [], warehouses: [], costCenters: [], taxRules: [] });
}

export async function getGovernance() {
  return fetchJson<any>("/demo/governance", { tasks: [], auditLogs: [] });
}

export async function getBi() {
  return fetchJson<any>("/demo/bi", { kpis: { revenue: 0, expense: 0, inventoryValue: 0, operatingResult: 0 }, dre: [], topInventory: [] });
}

export async function getAulas() {
  return fetchJson<any>("/demo/aulas", { turmas: [], agendamentos: [], totalVagas: 0, totalMatriculados: 0, shareUrl: "" });
}

export async function getQuadras() {
  return fetchJson<any>("/demo/quadras", { quadras: [], agendaHoje: [] });
}

export async function getTorneios() {
  return fetchJson<any>("/demo/torneios", { torneios: [] });
}
