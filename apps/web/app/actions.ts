"use server";

import { revalidatePath } from "next/cache";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function post(path: string, payload: Record<string, string>) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Falha em ${path}`);
  }

  return response.json();
}

function revalidateErp() {
  [
    "/dashboard",
    "/comercial",
    "/compras",
    "/financeiro",
    "/fiscal",
    "/estoque",
    "/producao",
    "/cadastros",
    "/governanca",
    "/bi"
  ].forEach((path) => revalidatePath(path));
}

export async function createSalesOrder(formData: FormData) {
  await post("/demo/actions/sales-order", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createPurchaseOrder(formData: FormData) {
  await post("/demo/actions/purchase-order", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createProductionOrder(formData: FormData) {
  await post("/demo/actions/production-order", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createTask(formData: FormData) {
  await post("/demo/actions/task", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createProduct(formData: FormData) {
  await post("/demo/actions/product", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createCustomer(formData: FormData) {
  await post("/demo/actions/customer", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createSupplier(formData: FormData) {
  await post("/demo/actions/supplier", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createWarehouse(formData: FormData) {
  await post("/demo/actions/warehouse", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createCostCenter(formData: FormData) {
  await post("/demo/actions/cost-center", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createTaxRule(formData: FormData) {
  await post("/demo/actions/tax-rule", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}

export async function createBom(formData: FormData) {
  await post("/demo/actions/bom", Object.fromEntries(formData.entries()) as Record<string, string>);
  revalidateErp();
}
