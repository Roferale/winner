export type DecimalLike = string | number;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}: ${response.status}`);
  }
  return response.json();
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

export async function getOverview() {
  return fetchJson<any>("/demo/overview");
}

export async function getMasterData() {
  return fetchJson<any>("/demo/master-data");
}

export async function getCommercial() {
  return fetchJson<any>("/demo/commercial");
}

export async function getPurchases() {
  return fetchJson<any>("/demo/purchases");
}

export async function getFinance() {
  return fetchJson<any>("/demo/finance");
}

export async function getFinancialControl() {
  return fetchJson<any>("/demo/financial-control");
}

export async function getAlunos() {
  return fetchJson<any>("/demo/alunos");
}

export async function getFiscal() {
  return fetchJson<any>("/demo/fiscal");
}

export async function getInventory() {
  return fetchJson<any>("/demo/inventory");
}

export async function getProduction() {
  return fetchJson<any>("/demo/production");
}

export async function getPeople() {
  return fetchJson<any>("/demo/people");
}

export async function getGovernance() {
  return fetchJson<any>("/demo/governance");
}

export async function getBi() {
  return fetchJson<any>("/demo/bi");
}

export async function getAulas() {
  return fetchJson<any>("/demo/aulas");
}

export async function getQuadras() {
  return fetchJson<any>("/demo/quadras");
}

export async function getTorneios() {
  return fetchJson<any>("/demo/torneios");
}
