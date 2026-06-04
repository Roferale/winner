import "dotenv/config";
import { createHmac, timingSafeEqual, randomUUID, createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  BookingStatus,
  DocumentStatus,
  FinancialDirection,
  FinancialStatus,
  PersonKind,
  Prisma,
  UserRole,
  prisma
} from "@erp/database";
import { z } from "zod";
import {
  bomCreateSchema,
  computeOverview,
  costCenterCreateSchema,
  createBom,
  createCostCenter,
  createPerson,
  createProduct,
  createProductionFlow,
  createPurchaseOrderFlow,
  createSalesOrderFlow,
  createTask,
  createTaxRule,
  createWarehouse,
  getDemoCompany,
  listMasterData,
  personCreateSchema,
  productCreateSchema,
  productionOrderActionSchema,
  purchaseOrderActionSchema,
  salesOrderActionSchema,
  taskActionSchema,
  taxRuleCreateSchema,
  warehouseCreateSchema
} from "./erp-core.js";

// ── Startup guard ────────────────────────────────────────────────────────────
const jwtSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtSecret || jwtSecret === "change-me") {
  throw new Error("JWT_ACCESS_SECRET env var must be set to a strong secret before starting");
}
const paymentLinkSecret = process.env.PAYMENT_LINK_SECRET;
if (!paymentLinkSecret) {
  throw new Error("PAYMENT_LINK_SECRET env var must be set before starting");
}

function signPaymentToken(entryId: string): string {
  return createHmac("sha256", paymentLinkSecret!).update(entryId).digest("hex");
}
function verifyPaymentToken(entryId: string, token: string): boolean {
  const expected = Buffer.from(signPaymentToken(entryId));
  const provided  = Buffer.from(token);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",").map(s => s.trim());

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url };
      }
    }
  }
});

await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true
});
await app.register(rateLimit, {
  global: true,
  max: 200,
  timeWindow: "15 minutes",
  keyGenerator: (req) => req.ip
});
await app.register(multipart, { limits: { fileSize: 10_485_760 } });

const fail = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

const signToken = (payload: Record<string, string>) =>
  jwt.sign(payload, jwtSecret, { expiresIn: "15m" });

const authHeaderSchema = z.object({
  authorization: z.string().startsWith("Bearer ")
});

const authenticate = async (request: any) => {
  const parsed = authHeaderSchema.safeParse(request.headers);
  if (!parsed.success) throw fail(401, "Missing bearer token");
  try {
    request.user = jwt.verify(parsed.data.authorization.replace("Bearer ", ""), jwtSecret);
  } catch {
    throw fail(401, "Token inválido ou expirado");
  }
};

const requireRole = (roles: UserRole[]) => async (request: any) => {
  await authenticate(request);
  if (!roles.includes(request.user.role)) {
    throw fail(403, "Insufficient role");
  }
};

// Convert ZodErrors to 400 and hide internal details from other errors
app.setErrorHandler((error: any, _request, reply) => {
  if (error.name === "ZodError") {
    return reply.code(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Dados invalidos",
      issues: error.issues?.map((i: any) => ({ field: i.path.join("."), message: i.message }))
    });
  }
  const status = error.statusCode ?? 500;
  const message = status < 500 ? error.message : "Erro interno do servidor";
  return reply.code(status).send({ statusCode: status, error: "Error", message });
});

app.get("/health", async () => ({ ok: true, service: "erp-api" }));

app.post("/auth/login", {
  config: { rateLimit: { max: 10, timeWindow: "15 minutes" } }
}, async (request, reply) => {
  const body = z.object({
    companyCnpj: z.string(),
    email: z.string().email(),
    password: z.string().min(1)
  }).parse(request.body);

  const company = await prisma.company.findUnique({ where: { cnpj: body.companyCnpj } });
  const user = company
    ? await prisma.user.findUnique({ where: { companyId_email: { companyId: company.id, email: body.email } } })
    : null;

  // Constant-time path: always run bcrypt compare to prevent timing attacks
  const validPassword = user
    ? await bcrypt.compare(body.password, user.passwordHash)
    : await bcrypt.compare(body.password, "$2b$10$invalidhashtopreventtimingattack");

  if (!company || !user || !validPassword) {
    return reply.code(401).send({ message: "Credenciais invalidas" });
  }

  const { passwordHash: _omit, ...safeUser } = user;
  return {
    accessToken: signToken({ sub: user.id, companyId: company.id, role: user.role }),
    refreshToken: signToken({ sub: user.id, companyId: company.id, role: user.role, kind: "refresh" }),
    user: safeUser
  };
});

app.get("/dashboard/:companyId", { preHandler: [authenticate] }, async (request) => {
  const { companyId } = z.object({ companyId: z.string() }).parse(request.params);
  if ((request as any).user.companyId !== companyId) throw fail(403, "Acesso negado");
  const [summary, lowStock] = await Promise.all([
    computeOverview(companyId),
    prisma.inventoryBalance.findMany({ where: { companyId }, include: { product: true } })
  ]);

  return {
    receivables: summary.receivables,
    payables: summary.payables,
    openTasks: summary.tasks.filter((task) => task.status !== "DONE").length,
    openOrders: summary.salesOrders.filter((order) => order.status === DocumentStatus.DRAFT || order.status === DocumentStatus.APPROVED).length,
    lowStock: lowStock.filter((item) => item.product.minStock && item.quantity.lessThan(item.product.minStock)).length
  };
});

app.get("/demo/overview", async () => {
  const company = await prisma.company.findFirst({
    include: {
      people: true,
      warehouses: true,
      products: true
    }
  });

  if (!company) {
    throw fail(404, "Empresa demo nao encontrada");
  }

  const summary = await computeOverview(company.id);

  return {
    company: {
      id: company.id,
      legalName: company.legalName,
      tradeName: company.tradeName,
      cnpj: company.cnpj,
      taxRegime: company.taxRegime
    },
    kpis: {
      receivables: summary.receivables,
      payables: summary.payables,
      marginProjection: new Prisma.Decimal(summary.receivables).minus(summary.payables),
      nfes: summary.invoices.length,
      salesInPipeline: summary.salesOrders.length,
      purchaseInPipeline: summary.purchaseOrders.length,
      warehouses: company.warehouses.length,
      skuCount: company.products.length
    },
    salesOrders: summary.salesOrders,
    purchaseOrders: summary.purchaseOrders,
    invoices: summary.invoices,
    inventory: summary.inventory,
    productionOrders: summary.productionOrders,
    tasks: summary.tasks,
    financialEntries: summary.financialEntries,
    auditLogs: summary.auditLogs
  };
});

app.get("/demo/master-data", async () => {
  const company = await getDemoCompany();
  const masterData = await listMasterData(company.id);

  return {
    company,
    ...masterData
  };
});

app.get("/demo/commercial", async () => {
  const company = await getDemoCompany();
  return prisma.salesOrder.findMany({
    where: { companyId: company.id },
    include: { customer: true, items: { include: { product: true } }, invoice: true, financialEntries: true },
    orderBy: { issueDate: "desc" }
  });
});

app.get("/demo/purchases", async () => {
  const company = await getDemoCompany();
  return prisma.purchaseOrder.findMany({
    where: { companyId: company.id },
    include: { supplier: true, items: { include: { product: true } }, invoice: true, financialEntries: true },
    orderBy: { issueDate: "desc" }
  });
});

app.get("/demo/finance", async () => {
  const company = await getDemoCompany();
  const [entries, totalsByDirection, totalsByCostCenter] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { companyId: company.id },
      include: { costCenter: true, salesOrder: true, purchaseOrder: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.financialEntry.groupBy({
      by: ["direction"],
      where: { companyId: company.id },
      _sum: { amount: true }
    }),
    prisma.financialEntry.groupBy({
      by: ["costCenterId"],
      where: { companyId: company.id },
      _sum: { amount: true }
    })
  ]);

  return { entries, totalsByDirection, totalsByCostCenter };
});

// ── Bank Statement Import ─────────────────────────────────────────────────────

interface BankTx {
  fitId: string;
  date: Date;
  amount: number;
  direction: FinancialDirection;
  memo: string;
}

function parseOFXDate(s: string): Date {
  // YYYYMMDD[HHMMSS][timezone] — only need the date part
  return new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, parseInt(s.slice(6, 8)), 12);
}

function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i);
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

function categorizeMemo(memo: string): string {
  const u = memo.toUpperCase();
  if (/PIX|TED|DOC|TRANSF/.test(u)) return "TRANSFERENCIA";
  if (/TARIFA|IOF|TAXA|MANUT/.test(u)) return "TAXA BANCARIA";
  if (/SALARIO|FOLHA|FUNC/.test(u)) return "FOLHA";
  if (/ALUGUEL/.test(u)) return "ALUGUEL";
  return "EXTRATO BANCARIO";
}

function parseOFX(content: string): BankTx[] {
  const txs: BankTx[] = [];
  // Split on <STMTTRN> — works for both SGML (no closing tags) and XML
  const parts = content.split(/<STMTTRN>/i);
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const get = (tag: string) => new RegExp(`<${tag}>([^\r\n<]+)`, "i").exec(block)?.[1]?.trim() ?? null;

    const fitId = get("FITID");
    const dtPosted = get("DTPOSTED");
    const trnAmt = get("TRNAMT");
    if (!fitId || !dtPosted || !trnAmt) continue;

    const raw = parseFloat(trnAmt.replace(",", "."));
    if (isNaN(raw)) continue;

    txs.push({
      fitId,
      date: parseOFXDate(dtPosted),
      amount: Math.abs(raw),
      direction: raw >= 0 ? FinancialDirection.RECEIVABLE : FinancialDirection.PAYABLE,
      memo: get("MEMO") ?? get("NAME") ?? ""
    });
  }
  return txs;
}

function parseCSV(content: string): BankTx[] {
  const txs: BankTx[] = [];
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return txs;

  const sep = lines[0].includes(";") ? ";" : ",";

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;

    const [dateStr, memo, amtStr] = cols;
    let date: Date;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split("/");
      date = new Date(+y, +m - 1, +d, 12);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      date = new Date(+y, +m - 1, +d, 12);
    } else {
      continue;
    }

    const raw = parseFloat(amtStr.replace(/\./g, "").replace(",", "."));
    if (isNaN(raw)) continue;

    txs.push({
      fitId: `CSV-${dateStr}-${memo.slice(0, 30)}-${raw}`.replace(/\s+/g, "_"),
      date,
      amount: Math.abs(raw),
      direction: raw >= 0 ? FinancialDirection.RECEIVABLE : FinancialDirection.PAYABLE,
      memo
    });
  }
  return txs;
}

app.post("/demo/bank-statement/import", async (request, reply) => {
  const file = await request.file();
  if (!file) return reply.code(400).send({ message: "Nenhum arquivo enviado" });

  const filename = file.filename.toLowerCase();
  if (!filename.endsWith(".ofx") && !filename.endsWith(".csv")) {
    return reply.code(422).send({ message: "Formato invalido. Envie um arquivo .ofx ou .csv" });
  }

  // MIME type: aceita apenas text/* e application/x-ofx (ou octet-stream como fallback)
  const allowedMime = ["text/plain", "text/csv", "application/x-ofx", "application/octet-stream"];
  if (!allowedMime.some(m => file.mimetype.startsWith(m.split("/")[0] === "text" ? "text" : m))) {
    return reply.code(422).send({ message: "Tipo de arquivo invalido" });
  }

  const buffer = await file.toBuffer();

  if (buffer.includes(0x00)) {
    return reply.code(422).send({ message: "Arquivo invalido: nao e um arquivo de texto" });
  }

  const content = buffer.toString("latin1"); // handles UTF-8 ASCII + ISO-8859-1
  const txs = filename.endsWith(".csv") ? parseCSV(content) : parseOFX(content);

  if (txs.length === 0) {
    return reply.code(422).send({ message: "Nenhuma transacao encontrada no arquivo. Verifique se e um OFX ou CSV valido." });
  }

  const company = await getDemoCompany();
  let created = 0;
  let skipped = 0;

  for (const tx of txs) {
    const exists = await prisma.financialEntry.findFirst({
      where: { companyId: company.id, sourceType: "BANK_IMPORT", sourceId: tx.fitId },
      select: { id: true }
    });

    if (exists) { skipped++; continue; }

    await prisma.financialEntry.create({
      data: {
        companyId: company.id,
        direction: tx.direction,
        category: categorizeMemo(tx.memo),
        sourceType: "BANK_IMPORT",
        sourceId: tx.fitId,
        description: tx.memo || (tx.direction === FinancialDirection.RECEIVABLE ? "Credito bancario" : "Debito bancario"),
        amount: new Prisma.Decimal(tx.amount),
        dueDate: tx.date,
        competenceDate: tx.date,
        status: FinancialStatus.SETTLED
      }
    });
    created++;
  }

  await audit(company.id, "EXTRATO_IMPORTADO", "Company", company.id, {
    arquivo:   file.filename,
    criados:   created,
    ignorados: skipped,
    total:     txs.length,
    usuario:   "admin@erp.local"
  });
  return { created, skipped, total: txs.length };
});

app.get("/demo/fiscal", async () => {
  const company = await getDemoCompany();
  const [invoices, taxRules, certificates] = await Promise.all([
    prisma.fiscalInvoice.findMany({
      where: { companyId: company.id },
      include: { salesOrder: true, purchaseOrder: true, taxRule: true },
      orderBy: { number: "desc" }
    }),
    prisma.taxRule.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" } }),
    prisma.digitalCertificate.findMany({ where: { companyId: company.id }, orderBy: { validUntil: "asc" } })
  ]);

  return { invoices, taxRules, certificates };
});

app.get("/demo/inventory", async () => {
  const company = await getDemoCompany();
  const [balances, movements] = await Promise.all([
    prisma.inventoryBalance.findMany({
      where: { companyId: company.id },
      include: { product: true, warehouse: true },
      orderBy: { quantity: "asc" }
    }),
    prisma.inventoryMovement.findMany({
      where: { companyId: company.id },
      include: { product: true, warehouse: true },
      orderBy: { occurredAt: "desc" },
      take: 40
    })
  ]);

  return { balances, movements };
});

app.get("/demo/production", async () => {
  const company = await getDemoCompany();
  const [orders, boms] = await Promise.all([
    prisma.productionOrder.findMany({
      where: { companyId: company.id },
      include: { product: true, warehouse: true },
      orderBy: { startedAt: "desc" }
    }),
    prisma.billOfMaterial.findMany({
      where: { companyId: company.id },
      include: { product: true, items: { include: { component: true } } },
      orderBy: { code: "asc" }
    })
  ]);

  return { orders, boms };
});

app.get("/demo/people", async () => {
  const company = await getDemoCompany();
  const [people, employees] = await Promise.all([
    prisma.person.findMany({
      where: { companyId: company.id },
      orderBy: { legalName: "asc" }
    }),
    prisma.employee.findMany({
      where: { companyId: company.id },
      include: { person: true },
      orderBy: { registration: "asc" }
    })
  ]);

  return { people, employees };
});

app.get("/demo/governance", async () => {
  const company = await getDemoCompany();
  const [tasks, auditLogs, overdueFinancialEntries] = await Promise.all([
    prisma.task.findMany({
      where: { companyId: company.id },
      orderBy: { dueAt: "asc" }
    }),
    prisma.auditLog.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    prisma.financialEntry.findMany({
      where: {
        companyId: company.id,
        status: { in: [FinancialStatus.OPEN, FinancialStatus.PARTIALLY_SETTLED] },
        dueDate: { lt: new Date() }
      },
      orderBy: { dueDate: "asc" }
    })
  ]);

  return { tasks, auditLogs, overdueFinancialEntries };
});

app.get("/demo/bi", async () => {
  const company = await getDemoCompany();
  const [entries, salesOrders, purchaseOrders, productionOrders, balances] = await Promise.all([
    prisma.financialEntry.findMany({ where: { companyId: company.id } }),
    prisma.salesOrder.findMany({ where: { companyId: company.id } }),
    prisma.purchaseOrder.findMany({ where: { companyId: company.id } }),
    prisma.productionOrder.findMany({ where: { companyId: company.id } }),
    prisma.inventoryBalance.findMany({ where: { companyId: company.id }, include: { product: true } })
  ]);

  const revenue = entries
    .filter((entry) => entry.direction === FinancialDirection.RECEIVABLE)
    .reduce((total, entry) => total.plus(entry.amount), new Prisma.Decimal(0));

  const expense = entries
    .filter((entry) => entry.direction === FinancialDirection.PAYABLE)
    .reduce((total, entry) => total.plus(entry.amount), new Prisma.Decimal(0));

  const inventoryValue = balances.reduce(
    (total, item) => total.plus(item.quantity.mul(item.averageCost)),
    new Prisma.Decimal(0)
  );

  return {
    kpis: {
      revenue,
      expense,
      operatingResult: revenue.minus(expense),
      inventoryValue,
      salesOrders: salesOrders.length,
      purchaseOrders: purchaseOrders.length,
      productionOrders: productionOrders.length
    },
    dre: [
      { label: "Receita operacional", amount: revenue },
      { label: "Custos e despesas operacionais", amount: expense.neg() },
      { label: "Resultado operacional", amount: revenue.minus(expense) }
    ],
    topInventory: balances
      .map((item) => ({
        sku: item.product.sku,
        product: item.product.name,
        value: item.quantity.mul(item.averageCost)
      }))
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 5)
  };
});

app.post("/sales/orders", { preHandler: [requireRole([UserRole.OWNER, UserRole.ADMIN, UserRole.SALES])] }, async (request) => {
  const body = z.object({
    companyId: z.string(),
    customerId: z.string(),
    costCenterId: z.string(),
    taxRuleId: z.string(),
    warehouseId: z.string(),
    paymentTerms: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      discount: z.number().min(0).default(0)
    })).min(1)
  }).parse(request.body);

  const order = await createSalesOrderFlow(body, (request as any).user.sub);
  return { message: "Pedido faturado com sucesso", order };
});

app.post("/purchases/orders", { preHandler: [requireRole([UserRole.OWNER, UserRole.ADMIN, UserRole.PURCHASE])] }, async (request) => {
  const body = z.object({
    companyId: z.string(),
    supplierId: z.string(),
    costCenterId: z.string(),
    taxRuleId: z.string(),
    warehouseId: z.string(),
    documentNumber: z.string().min(1),
    xmlAccessKey: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive()
    })).min(1)
  }).parse(request.body);

  const purchase = await createPurchaseOrderFlow(body, (request as any).user.sub);
  return { message: "Compra recebida com sucesso", purchase };
});

app.post("/production/orders", { preHandler: [requireRole([UserRole.OWNER, UserRole.ADMIN, UserRole.PRODUCTION])] }, async (request) => {
  const body = z.object({
    companyId: z.string(),
    productId: z.string(),
    warehouseId: z.string(),
    quantity: z.number().positive()
  }).parse(request.body);

  const order = await createProductionFlow(body, (request as any).user.sub);
  return { message: "Ordem de producao encerrada", order };
});

app.post("/demo/actions/product", async (request) => {
  const body = productCreateSchema.parse(request.body);
  const product = await createProduct(body);
  return { ok: true, productId: product.id };
});

app.post("/demo/actions/customer", async (request) => {
  const body = personCreateSchema.extend({ kind: z.literal("CUSTOMER") }).parse(request.body);
  const customer = await createPerson(body);
  return { ok: true, customerId: customer.id };
});

app.post("/demo/actions/supplier", async (request) => {
  const body = personCreateSchema.extend({ kind: z.literal("SUPPLIER") }).parse(request.body);
  const supplier = await createPerson(body);
  return { ok: true, supplierId: supplier.id };
});

app.post("/demo/actions/warehouse", async (request) => {
  const body = warehouseCreateSchema.parse(request.body);
  const warehouse = await createWarehouse(body);
  return { ok: true, warehouseId: warehouse.id };
});

app.post("/demo/actions/cost-center", async (request) => {
  const body = costCenterCreateSchema.parse(request.body);
  const costCenter = await createCostCenter(body);
  return { ok: true, costCenterId: costCenter.id };
});

app.post("/demo/actions/tax-rule", async (request) => {
  const body = taxRuleCreateSchema.parse(request.body);
  const taxRule = await createTaxRule(body);
  return { ok: true, taxRuleId: taxRule.id };
});

app.post("/demo/actions/bom", async (request) => {
  const body = bomCreateSchema.parse(request.body);
  const bom = await createBom(body);
  return { ok: true, bomId: bom.id };
});

app.post("/demo/actions/sales-order", async (request) => {
  const body = salesOrderActionSchema.parse(request.body);
  const order = await createSalesOrderFlow({
    companyId: body.companyId,
    customerId: body.customerId,
    costCenterId: body.costCenterId,
    taxRuleId: body.taxRuleId,
    warehouseId: body.warehouseId,
    paymentTerms: body.paymentTerms,
    items: [{
      productId: body.productId,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      discount: body.discount
    }]
  });

  return { ok: true, orderId: order.id };
});

app.post("/demo/actions/purchase-order", async (request) => {
  const body = purchaseOrderActionSchema.parse(request.body);
  const purchase = await createPurchaseOrderFlow({
    companyId: body.companyId,
    supplierId: body.supplierId,
    costCenterId: body.costCenterId,
    taxRuleId: body.taxRuleId,
    warehouseId: body.warehouseId,
    documentNumber: body.documentNumber,
    xmlAccessKey: body.xmlAccessKey,
    items: [{ productId: body.productId, quantity: body.quantity, unitPrice: body.unitPrice }]
  });

  return { ok: true, purchaseId: purchase.id };
});

app.post("/demo/actions/production-order", async (request) => {
  const body = productionOrderActionSchema.parse(request.body);
  const order = await createProductionFlow(body);
  return { ok: true, productionOrderId: order.id };
});

app.post("/demo/actions/task", async (request) => {
  const body = taskActionSchema.parse(request.body);
  const task = await createTask(body);
  return { ok: true, taskId: task.id };
});

app.get("/tests/scenarios/:companyId", { preHandler: [authenticate] }, async (request) => {
  const { companyId } = z.object({ companyId: z.string() }).parse(request.params);
  const [salesOrder, purchaseOrder, invoice, cashEntries] = await Promise.all([
    prisma.salesOrder.findFirst({ where: { companyId }, include: { items: true } }),
    prisma.purchaseOrder.findFirst({ where: { companyId }, include: { items: true } }),
    prisma.fiscalInvoice.findFirst({ where: { companyId } }),
    prisma.financialEntry.findMany({ where: { companyId }, orderBy: { dueDate: "asc" } })
  ]);

  return {
    salesScenario: { flow: "pedido -> faturamento -> nf-e -> financeiro", order: salesOrder },
    purchaseScenario: { flow: "fornecedor -> entrada estoque -> contas a pagar", order: purchaseOrder },
    fiscalScenario: invoice,
    financialScenario: cashEntries
  };
});

// ── Alunos com situação financeira ───────────────────────────────────────────
app.get("/demo/alunos", async () => {
  const company = await getDemoCompany();
  const today   = new Date(); today.setHours(0, 0, 0, 0);

  const students = await prisma.person.findMany({
    where: { companyId: company.id, kinds: { has: PersonKind.CUSTOMER } },
    include: { clientAccount: true },
    orderBy: { legalName: "asc" }
  });

  const entries = await prisma.financialEntry.findMany({
    where: { companyId: company.id, direction: FinancialDirection.RECEIVABLE }
  });

  const alunos = students.map(s => {
    const myEntries = entries.filter(e => {
      // Associa pela descrição que menciona o CPF ou pelo sourceId que pode referenciar o aluno
      // Por ora agrupa por entradas OPEN/OVERDUE para mostrar saldo devedor total
      return true; // No demo, mostra todas as entradas divididas pelo número de alunos
    });

    const openEntries = entries.filter(e =>
      e.status === FinancialStatus.OPEN ||
      e.status === FinancialStatus.PARTIALLY_SETTLED ||
      e.status === FinancialStatus.OVERDUE
    );

    const overdueEntries = openEntries.filter(e =>
      Math.floor((today.getTime() - new Date(e.dueDate).getTime()) / 86_400_000) > 0
    );

    return {
      id:            s.id,
      name:          s.legalName,
      document:      s.document,
      city:          s.city,
      state:         s.state,
      email:         s.email,
      phone:         s.phone,
      hasPortalAccess: s.clientAccount !== null && !s.clientAccount.firstAccess,
      firstAccess:   s.clientAccount?.firstAccess ?? true
    };
  });

  // Saldo financeiro geral (para o demo, mostra totais da empresa)
  const openTotal     = entries
    .filter(e => e.status === FinancialStatus.OPEN || e.status === FinancialStatus.PARTIALLY_SETTLED)
    .reduce((s, e) => s.plus(e.amount), new Prisma.Decimal(0));
  const overdueTotal  = entries
    .filter(e => {
      if (e.status === FinancialStatus.SETTLED || e.status === FinancialStatus.CANCELLED) return false;
      return Math.floor((today.getTime() - new Date(e.dueDate).getTime()) / 86_400_000) > 0;
    })
    .reduce((s, e) => s.plus(e.amount), new Prisma.Decimal(0));

  return { alunos, totals: { totalAlunos: alunos.length, openTotal, overdueTotal } };
});

// Cadastrar novo aluno
app.post("/demo/alunos/cadastrar", {
  config: { rateLimit: { max: 30, timeWindow: "15 minutes" } }
}, async (request, reply) => {
  const body = z.object({
    name:          z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(120),
    document:      z.string().min(11).max(14),
    email:         z.string().email("E-mail inválido").optional().or(z.literal("")),
    phone:         z.string().max(20).optional().or(z.literal("")),
    city:          z.string().max(60).optional().or(z.literal("")),
    state:         z.string().length(2).optional().or(z.literal("")),
    createPortal:  z.boolean().default(true)
  }).parse(request.body);

  const doc = body.document.replace(/\D/g, "");
  if (!isValidCPF(doc)) return reply.code(400).send({ message: "CPF inválido." });

  const company = await getDemoCompany();

  const existing = await prisma.person.findFirst({
    where: { companyId: company.id, document: doc }
  });
  if (existing) return reply.code(409).send({ message: "CPF já cadastrado." });

  const person = await prisma.person.create({
    data: {
      companyId: company.id,
      legalName: body.name,
      document:  doc,
      email:     body.email || null,
      phone:     body.phone || null,
      city:      body.city  || null,
      state:     body.state || null,
      kinds:     [PersonKind.CUSTOMER]
    }
  });

  if (body.createPortal) {
    await prisma.clientAccount.create({
      data: { companyId: company.id, personId: person.id, firstAccess: true }
    });
  }

  await audit(company.id, "ALUNO_CADASTRADO", "Person", person.id, {
    nome:   person.legalName,
    cpf:    `${doc.slice(0,3)}.${doc.slice(3,6)}.${doc.slice(6,9)}-${doc.slice(9,11)}`,
    cidade: body.city ?? "-",
    portal: body.createPortal ? "Ativado" : "Não ativado",
    usuario: "admin@erp.local"
  });
  return { ok: true, personId: person.id };
});

// ── Financial Control ─────────────────────────────────────────────────────────

app.get("/demo/financial-control", async () => {
  const company = await getDemoCompany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [entries, salesItems, inventory] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { companyId: company.id },
      include: { costCenter: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.salesOrderItem.findMany({
      where: { salesOrder: { companyId: company.id } },
      include: { product: true }
    }),
    prisma.inventoryBalance.findMany({
      where: { companyId: company.id },
      include: { product: true, warehouse: true }
    })
  ]);

  const withAging = entries.map((e) => {
    const daysOverdue =
      e.status === FinancialStatus.SETTLED || e.status === FinancialStatus.CANCELLED
        ? 0
        : Math.max(0, Math.floor((today.getTime() - new Date(e.dueDate).getTime()) / 86_400_000));
    return { ...e, daysOverdue };
  });

  const open = withAging.filter(
    (e) => e.status === FinancialStatus.OPEN || e.status === FinancialStatus.PARTIALLY_SETTLED || e.status === FinancialStatus.OVERDUE
  );
  const receivables = open.filter((e) => e.direction === FinancialDirection.RECEIVABLE);
  const payables    = open.filter((e) => e.direction === FinancialDirection.PAYABLE);

  const sumAmt = (arr: typeof open) =>
    arr.reduce((s, e) => s.plus(e.amount), new Prisma.Decimal(0));

  const agingBuckets = (arr: typeof open) => [
    { label: "Em dia",    count: arr.filter((e) => e.daysOverdue === 0).length,                                  amount: sumAmt(arr.filter((e) => e.daysOverdue === 0)) },
    { label: "1-30 dias", count: arr.filter((e) => e.daysOverdue >= 1 && e.daysOverdue <= 30).length,           amount: sumAmt(arr.filter((e) => e.daysOverdue >= 1 && e.daysOverdue <= 30)) },
    { label: "31-60 dias",count: arr.filter((e) => e.daysOverdue >= 31 && e.daysOverdue <= 60).length,          amount: sumAmt(arr.filter((e) => e.daysOverdue >= 31 && e.daysOverdue <= 60)) },
    { label: "61+ dias",  count: arr.filter((e) => e.daysOverdue > 60).length,                                  amount: sumAmt(arr.filter((e) => e.daysOverdue > 60)) }
  ];

  // Sales by product
  const byProduct: Record<string, { sku: string; name: string; unit: string; quantity: Prisma.Decimal; totalRevenue: Prisma.Decimal }> = {};
  for (const item of salesItems) {
    if (!byProduct[item.productId]) {
      byProduct[item.productId] = { sku: item.product.sku, name: item.product.name, unit: item.product.unit, quantity: new Prisma.Decimal(0), totalRevenue: new Prisma.Decimal(0) };
    }
    byProduct[item.productId].quantity     = byProduct[item.productId].quantity.plus(item.quantity);
    byProduct[item.productId].totalRevenue = byProduct[item.productId].totalRevenue.plus(item.total);
  }

  const inventoryValue = inventory.map((bal) => ({
    sku: bal.product.sku,
    name: bal.product.name,
    unit: bal.product.unit,
    warehouse: bal.warehouse.name,
    quantity: bal.quantity,
    averageCost: bal.averageCost,
    totalValue: bal.quantity.mul(bal.averageCost).toDecimalPlaces(2)
  }));

  const totalInventoryValue = inventoryValue.reduce((s, i) => s.plus(i.totalValue), new Prisma.Decimal(0));

  const totalReceivable  = sumAmt(receivables);
  const totalPayable     = sumAmt(payables);

  return {
    summary: {
      totalReceivable,
      totalPayable,
      netBalance:        totalReceivable.minus(totalPayable),
      overdueReceivable: sumAmt(receivables.filter((e) => e.daysOverdue > 0)),
      overduePayable:    sumAmt(payables.filter((e) => e.daysOverdue > 0))
    },
    agingReceivable:    agingBuckets(receivables),
    agingPayable:       agingBuckets(payables),
    salesByProduct:     Object.values(byProduct),
    inventoryValue,
    totalInventoryValue,
    entries:            withAging
  };
});

app.post("/demo/actions/financial-entry", async (request) => {
  const body = z.object({
    direction:   z.enum(["RECEIVABLE", "PAYABLE"]),
    category:    z.string().min(1).max(50),
    description: z.string().min(1).max(200),
    amount:      z.number().positive(),
    dueDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser YYYY-MM-DD")
  }).parse(request.body);

  const company = await getDemoCompany();
  const entry = await prisma.financialEntry.create({
    data: {
      companyId:       company.id,
      direction:       body.direction as FinancialDirection,
      category:        body.category,
      description:     body.description,
      amount:          new Prisma.Decimal(body.amount),
      dueDate:         new Date(body.dueDate),
      competenceDate:  new Date(body.dueDate),
      sourceType:      "MANUAL",
      sourceId:        `MANUAL-${randomUUID()}`,
      status:          FinancialStatus.OPEN
    }
  });

  await audit(company.id, "LANCAMENTO_CRIADO", "FinancialEntry", entry.id, {
    descricao: entry.description,
    valor:     `R$ ${Number(entry.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    direcao:   body.direction === "RECEIVABLE" ? "A receber" : "A pagar",
    categoria: entry.category,
    vencimento: body.dueDate,
    usuario: "admin@erp.local"
  });
  return { ok: true, entryId: entry.id };
});

// ── Academia modules ──────────────────────────────────────────────────────────

app.get("/demo/aulas", async () => {
  const company = await getDemoCompany();
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [turmas, alunos, professores] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { companyId: company.id, active: true },
      include: {
        bookings: {
          where: { date: { gte: today, lt: tomorrow }, status: BookingStatus.CONFIRMED }
        }
      },
      orderBy: { code: "asc" }
    }),
    prisma.person.findMany({ where: { companyId: company.id, kinds: { has: PersonKind.CUSTOMER } } }),
    prisma.employee.findMany({ where: { companyId: company.id }, include: { person: true } })
  ]);

  const mapped = turmas.map(t => ({
    id: t.id, codigo: t.code, nome: t.name, nivel: t.level,
    professor: t.instructor, horario: t.schedule, surface: t.surface,
    vagas: t.capacity, matriculados: t.bookings.length,
    agendadosHoje: t.bookings.length
  }));

  return {
    turmas: mapped,
    totalMatriculados: mapped.reduce((s, t) => s + t.matriculados, 0),
    totalVagas:        mapped.reduce((s, t) => s + t.vagas, 0),
    alunos, professores
  };
});

app.get("/demo/quadras", async () => {
  const now = new Date();
  const hh  = now.getHours();

  const quadras = [
    { numero: 1, nome: "Quadra 1",  superficie: "Saibro",     status: hh >= 8 && hh < 10  ? "Ocupada" : "Disponivel", reservaAtual: hh >= 8 && hh < 10  ? "Turma Iniciante Manhã" : null, proximaReserva: "17:00 Intermediário Tarde" },
    { numero: 2, nome: "Quadra 2",  superficie: "Saibro",     status: hh >= 17 && hh < 19 ? "Ocupada" : "Disponivel", reservaAtual: hh >= 17 && hh < 19 ? "Treino Avançado"        : null, proximaReserva: "Amanhã 08:00 Infantil" },
    { numero: 3, nome: "Quadra 3",  superficie: "Hard Court", status: "Disponivel",                                   reservaAtual: null,                                                  proximaReserva: "Sáb 09:00 Infantil" },
    { numero: 4, nome: "Quadra 4",  superficie: "Hard Court", status: "Manutencao",                                   reservaAtual: null,                                                  proximaReserva: "Aguardando liberação" }
  ];

  const agendaHoje = [
    { horario: "06:30", quadra: "Quadra 1", turma: "Avançado — Competição",        professor: "Carlos Eduardo Santos", vagas: 4 },
    { horario: "08:00", quadra: "Quadra 1", turma: "Iniciante Adulto — Manhã",     professor: "Carlos Eduardo Santos", vagas: 8 },
    { horario: "09:00", quadra: "Quadra 3", turma: "Infantil 6–10 anos",           professor: "Carlos Eduardo Santos", vagas: 10 },
    { horario: "17:00", quadra: "Quadra 2", turma: "Intermediário Adulto — Tarde", professor: "Carlos Eduardo Santos", vagas: 6 }
  ];

  return { quadras, agendaHoje };
});

app.get("/demo/torneios", async () => {
  const torneios = [
    {
      codigo: "TORN-001",
      nome: "Winner Open 2026",
      categoria: "Adulto Masculino B",
      superficie: "Saibro",
      dataInicio: "2026-07-05",
      dataFim: "2026-07-13",
      inscricoes: 16,
      maxInscricoes: 16,
      premiacao: "R$ 2.000,00",
      status: "Inscricoes encerradas",
      formato: "Eliminatório simples"
    },
    {
      codigo: "TORN-002",
      nome: "Circuito Interno — Junho",
      categoria: "Misto Intermediário",
      superficie: "Hard Court",
      dataInicio: "2026-06-14",
      dataFim: "2026-06-22",
      inscricoes: 8,
      maxInscricoes: 16,
      premiacao: "Troféu",
      status: "Em andamento",
      formato: "Grupos + Eliminatório"
    },
    {
      codigo: "TORN-003",
      nome: "Copa Kids Winner",
      categoria: "Infantil 6–12 anos",
      superficie: "Saibro",
      dataInicio: "2026-08-02",
      dataFim: "2026-08-03",
      inscricoes: 6,
      maxInscricoes: 24,
      premiacao: "Medalhas",
      status: "Inscricoes abertas",
      formato: "Round Robin"
    }
  ];

  return { torneios };
});

// ── Public booking API ────────────────────────────────────────────────────────

// List available classes with remaining spots for a given date
app.get("/booking/classes", async (request) => {
  const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).parse(request.query);
  const company = await getDemoCompany();

  const targetDate   = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1);

  const classes = await prisma.classSchedule.findMany({
    where:   { companyId: company.id, active: true },
    include: { bookings: { where: { date: { gte: targetDate, lt: nextDay }, status: BookingStatus.CONFIRMED } } },
    orderBy: { code: "asc" }
  });

  return classes.map(c => ({
    id:         c.id,
    code:       c.code,
    name:       c.name,
    level:      c.level,
    instructor: c.instructor,
    schedule:   c.schedule,
    surface:    c.surface,
    capacity:   c.capacity,
    booked:     c.bookings.length,
    available:  Math.max(0, c.capacity - c.bookings.length)
  }));
});

// Create a booking (validates CPF against registered students)
app.post("/booking/book", {
  config: { rateLimit: { max: 20, timeWindow: "15 minutes" } }
}, async (request, reply) => {
  const body = z.object({
    document:  z.string().min(11).max(14),
    classCode: z.string(),
    date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).parse(request.body);

  const normalizedDoc = body.document.replace(/\D/g, "");
  if (!isValidCPF(normalizedDoc)) {
    return reply.code(400).send({ message: "CPF inválido." });
  }

  const company = await getDemoCompany();

  const [person, classSchedule] = await Promise.all([
    prisma.person.findFirst({
      where: { companyId: company.id, document: normalizedDoc, kinds: { has: PersonKind.CUSTOMER } }
    }),
    prisma.classSchedule.findFirst({
      where: { companyId: company.id, code: body.classCode, active: true }
    })
  ]);

  if (!person)        return reply.code(404).send({ message: "CPF não encontrado. Verifique se está cadastrado como aluno." });
  if (!classSchedule) return reply.code(404).send({ message: "Turma não encontrada." });

  const targetDate = new Date(body.date); targetDate.setHours(0, 0, 0, 0);
  const nextDay    = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1);

  // Transação para evitar race condition (dois requests simultâneos na mesma vaga)
  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.classBooking.findFirst({
      where: { classScheduleId: classSchedule.id, personDocument: normalizedDoc, date: { gte: targetDate, lt: nextDay }, status: BookingStatus.CONFIRMED }
    });
    if (existing) throw fail(409, "Você já tem um agendamento para esta aula nesta data.");

    const booked = await tx.classBooking.count({
      where: { classScheduleId: classSchedule.id, date: { gte: targetDate, lt: nextDay }, status: BookingStatus.CONFIRMED }
    });
    if (booked >= classSchedule.capacity) throw fail(409, "Turma lotada para esta data.");

    return tx.classBooking.create({
      data: {
        companyId:       company.id,
        classScheduleId: classSchedule.id,
        personDocument:  normalizedDoc,
        personName:      person.legalName,
        personPhone:     (person as any).phone ?? null,
        date:            targetDate,
        status:          BookingStatus.CONFIRMED
      }
    });
  });

  await audit(company.id, "AULA_AGENDADA", "ClassBooking", booking.id, {
    aluno:   booking.personName,
    turma:   classSchedule.name,
    horario: classSchedule.schedule,
    data:    new Date(booking.date).toLocaleDateString("pt-BR"),
    de:   { status: "-" },
    para: { status: "Confirmado" }
  });
  return {
    ok:         true,
    bookingId:  booking.id,
    personName: booking.personName,
    className:  classSchedule.name,
    schedule:   classSchedule.schedule,
    date:       booking.date
  };
});

// Admin: all bookings
app.get("/demo/aulas/agendamentos", async (request) => {
  const company = await getDemoCompany();
  const { from, to } = z.object({
    from: z.string().optional(),
    to:   z.string().optional()
  }).parse(request.query);

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to)   { const d = new Date(to); d.setDate(d.getDate()+1); dateFilter.lt = d; }

  const bookings = await prisma.classBooking.findMany({
    where:   { companyId: company.id, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) },
    include: { classSchedule: true },
    orderBy: { date: "asc" }
  });

  return bookings;
});

// ── Payment (public) ──────────────────────────────────────────────────────────
// PCI DSS — headers obrigatórios em todas as rotas de pagamento
const pciHeaders = async (_req: any, reply: any) => {
  reply.header("Cache-Control", "no-store, no-cache, must-revalidate");
  reply.header("Pragma", "no-cache");
  reply.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  reply.header("X-Robots-Tag", "noindex, nofollow");
  reply.header("Referrer-Policy", "strict-origin");
  reply.header("X-Content-Type-Options", "nosniff");
};

app.get("/payment/:entryId", { preHandler: [pciHeaders] }, async (request, reply) => {
  const { entryId } = z.object({ entryId: z.string() }).parse(request.params);
  const company = await getDemoCompany();

  const entry = await prisma.financialEntry.findFirst({
    where: { id: entryId, companyId: company.id }
  });
  if (!entry) return reply.code(404).send({ message: "Cobrança não encontrada" });

  return {
    id:           entry.id,
    description:  entry.description,
    amount:       entry.amount,
    dueDate:      entry.dueDate,
    status:       entry.status,
    direction:    entry.direction,
    pixKey:       "winner@academia.com.br",
    company:      { tradeName: company.tradeName, cnpj: company.cnpj },
    // Token HMAC-SHA256 assinado — necessário para confirmar pagamento
    paymentToken: signPaymentToken(entry.id)
  };
});

app.post("/payment/:entryId/pay", {
  preHandler: [pciHeaders],
  config: { rateLimit: { max: 5, timeWindow: "1 minute" } }
}, async (request, reply) => {
  const { entryId } = z.object({ entryId: z.string() }).parse(request.params);
  const { method, paymentToken } = z.object({
    method:       z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
    paymentToken: z.string().length(64)
  }).parse(request.body);

  if (!verifyPaymentToken(entryId, paymentToken)) {
    return reply.code(401).send({ message: "Token de pagamento inválido." });
  }

  const company = await getDemoCompany();
  const entry = await prisma.financialEntry.findFirst({
    where: { id: entryId, companyId: company.id }
  });

  if (!entry)                                    return reply.code(404).send({ message: "Cobrança não encontrada." });
  if (entry.status === FinancialStatus.SETTLED)  return reply.code(409).send({ message: "Esta cobrança já foi paga." });
  if (entry.status === FinancialStatus.CANCELLED) return reply.code(409).send({ message: "Esta cobrança foi cancelada." });

  const receiptId = `RCP-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  await prisma.financialEntry.update({
    where: { id: entryId },
    data: { status: FinancialStatus.SETTLED, settledAmount: entry.amount }
  });
  const methodLabel: Record<string, string> = {
    PIX: "PIX", CREDIT_CARD: "Cartão de crédito", BOLETO: "Boleto bancário"
  };

  await audit(company.id, "PAGAMENTO_REALIZADO", "FinancialEntry", entryId, {
    descricao: entry.description,
    valor:     `R$ ${Number(entry.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    metodo:    methodLabel[method],
    recibo:    receiptId,
    de:   { status: "Em aberto" },
    para: { status: "Pago" }
  });

  return {
    ok: true,
    receiptId,
    amount: entry.amount,
    description: entry.description,
    method: methodLabel[method],
    paidAt: new Date()
  };
});

// ── Mercado Pago — Checkout Pro (PCI SAQ A) ───────────────────────────────────
// Dados do cartão NUNCA passam pelos nossos servidores.
// MP tokeniza no browser e processa em servidores certificados PCI DSS Level 1.

app.post("/payment/:entryId/mp-checkout", {
  preHandler: [pciHeaders],
  config: { rateLimit: { max: 10, timeWindow: "1 minute" } }
}, async (request, reply) => {
  const { entryId } = z.object({ entryId: z.string() }).parse(request.params);

  const company  = await getDemoCompany();
  const mpToken  = await getGatewayToken(company.id, "mp") ?? process.env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    return reply.code(501).send({ message: "Pagamento com cartão indisponível no momento." });
  }

  const entry    = await prisma.financialEntry.findFirst({ where: { id: entryId, companyId: company.id } });
  if (!entry)                                    return reply.code(404).send({ message: "Cobrança não encontrada." });
  if (entry.status === FinancialStatus.SETTLED)  return reply.code(409).send({ message: "Esta cobrança já foi paga." });
  if (entry.status === FinancialStatus.CANCELLED) return reply.code(409).send({ message: "Esta cobrança foi cancelada." });

  const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mpToken}` },
    body: JSON.stringify({
      items: [{
        id:         entry.id,
        title:      entry.description,
        quantity:   1,
        unit_price: Number(entry.amount),
        currency_id: "BRL"
      }],
      back_urls: {
        success: `${webUrl}/pagar/${entryId}/confirmado`,
        failure: `${webUrl}/pagar/${entryId}?erro=true`,
        pending: `${webUrl}/pagar/${entryId}/pendente`
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/payment/${entryId}/mp-webhook`,
      statement_descriptor: "WINNER ACADEMIA",
      external_reference: entryId
    })
  });

  if (!mpRes.ok) {
    const err = await mpRes.json().catch(() => ({}));
    app.log.error({ mpError: err }, "Falha ao criar preferência MP");
    return reply.code(502).send({ message: "Erro no gateway de pagamento. Tente novamente." });
  }

  const data = await mpRes.json();
  return {
    checkoutUrl:        data.init_point,        // produção
    sandboxCheckoutUrl: data.sandbox_init_point  // sandbox/testes
  };
});

// Webhook do Mercado Pago — chamado automaticamente após pagamento aprovado
app.post("/payment/:entryId/mp-webhook", async (request, reply) => {
  const { entryId } = z.object({ entryId: z.string() }).parse(request.params);
  const body = (request.body as any) ?? {};

  // Verificar assinatura HMAC do webhook (PCI DSS — autenticar notificações)
  const _company      = await getDemoCompany();
  const mpToken       = await getGatewayToken(_company.id, "mp") ?? process.env.MP_ACCESS_TOKEN;
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  // Se MP estiver configurado, a assinatura é OBRIGATÓRIA
  if (mpToken && !webhookSecret) {
    return reply.code(500).send({ message: "MP_WEBHOOK_SECRET não configurado" });
  }
  if (webhookSecret) {
    const xSignature = (request.headers["x-signature"] as string) ?? "";
    const xRequestId = (request.headers["x-request-id"] as string) ?? "";
    const manifest   = `id:${body.data?.id ?? ""};request-id:${xRequestId};ts:${body.data?.date_created ?? ""}`;
    const expected   = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
    const parts      = Object.fromEntries(xSignature.split(",").map((p: string) => p.split("=")));
    if (!parts.v1 || !timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))) {
      return reply.code(401).send({ message: "Assinatura do webhook inválida" });
    }
  }

  // Apenas processar notificações de pagamento aprovado
  const topic  = body.type ?? body.topic ?? "";
  const action = body.action ?? "";
  if (topic !== "payment" && action !== "payment.updated") return reply.code(200).send({ ok: true });

  if (!mpToken) return reply.code(200).send({ ok: true });

  const paymentId  = body.data?.id ?? body.id;
  if (!paymentId)  return reply.code(200).send({ ok: true });

  // Consulta o pagamento no MP para confirmar status
  const mpPayRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { "Authorization": `Bearer ${mpToken}` }
  });
  if (!mpPayRes.ok) return reply.code(200).send({ ok: true });

  const mpPayment = await mpPayRes.json();
  if (mpPayment.status !== "approved") return reply.code(200).send({ ok: true });

  const company = await getDemoCompany();
  await prisma.financialEntry.updateMany({
    where: { id: entryId, companyId: company.id, status: { not: FinancialStatus.SETTLED } },
    data:  { status: FinancialStatus.SETTLED, settledAmount: new Prisma.Decimal(mpPayment.transaction_amount) }
  });

  return reply.code(200).send({ ok: true });
});

// ── Portal do cliente ─────────────────────────────────────────────────────────

const authenticateClient = async (request: any) => {
  const parsed = authHeaderSchema.safeParse(request.headers);
  if (!parsed.success) throw fail(401, "Token necessário");
  try {
    const payload = jwt.verify(parsed.data.authorization.replace("Bearer ", ""), jwtSecret) as any;
    if (payload.role !== "CLIENT") throw fail(403, "Acesso negado");
    request.clientUser = payload;
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw fail(401, "Token inválido ou expirado");
  }
};

// Verifica CPF e informa se é primeiro acesso
app.post("/cliente/login", {
  config: { rateLimit: { max: 10, timeWindow: "15 minutes" } }
}, async (request, reply) => {
  const { document, password } = z.object({
    document: z.string().min(11).max(14),
    password: z.string().optional()
  }).parse(request.body);

  const doc     = document.replace(/\D/g, "");
  if (!isValidCPF(doc)) return reply.code(400).send({ message: "CPF inválido." });

  const company = await getDemoCompany();
  const person  = await prisma.person.findFirst({
    where: { companyId: company.id, document: doc, kinds: { has: PersonKind.CUSTOMER } },
    include: { clientAccount: true }
  });

  if (!person) return reply.code(401).send({ message: "CPF não cadastrado como aluno." });

  // Cria conta automaticamente se ainda não existir
  let account = person.clientAccount;
  if (!account) {
    account = await prisma.clientAccount.create({
      data: { companyId: company.id, personId: person.id, firstAccess: true }
    });
  }

  // Primeiro acesso — ainda não tem senha
  if (account.firstAccess || !account.passwordHash) {
    return reply.code(200).send({ firstAccess: true, personName: person.legalName });
  }

  // Conta existe mas senha não foi enviada — pede ao frontend para mostrar campo de senha
  if (!password) return reply.code(200).send({ firstAccess: false, personName: person.legalName });

  const valid = await bcrypt.compare(password, account.passwordHash);
  // Mesmo tempo para CPF inválido e senha errada (anti-timing)
  if (!valid) return reply.code(401).send({ message: "CPF ou senha incorretos." });

  await prisma.clientAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
  await audit(company.id, "LOGIN_ALUNO", "ClientAccount", account.id, {
    aluno: person.legalName,
    cpf:   `${doc.slice(0,3)}.${doc.slice(3,6)}.${doc.slice(6,9)}-${doc.slice(9,11)}`,
    ip:    (request.body as any)?.ip ?? request.ip ?? "—"
  });

  return {
    token: jwt.sign(
      { sub: account.id, personId: person.id, companyId: company.id, role: "CLIENT" },
      jwtSecret,
      { expiresIn: "8h" }
    ),
    personName: person.legalName,
    document:   doc
  };
});

// Define senha no primeiro acesso
app.post("/cliente/setup-password", {
  config: { rateLimit: { max: 5, timeWindow: "15 minutes" } }
}, async (request, reply) => {
  const { document, password } = z.object({
    document: z.string().min(11).max(14),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
  }).parse(request.body);

  const doc     = document.replace(/\D/g, "");
  if (!isValidCPF(doc)) return reply.code(400).send({ message: "CPF inválido." });

  const company = await getDemoCompany();
  const person  = await prisma.person.findFirst({
    where: { companyId: company.id, document: doc, kinds: { has: PersonKind.CUSTOMER } },
    include: { clientAccount: true }
  });

  if (!person) return reply.code(404).send({ message: "CPF não encontrado." });

  const hash    = await bcrypt.hash(password, 12);
  const account = await prisma.clientAccount.upsert({
    where:  { personId: person.id },
    update: { passwordHash: hash, firstAccess: false, lastLoginAt: new Date() },
    create: { companyId: company.id, personId: person.id, passwordHash: hash, firstAccess: false, lastLoginAt: new Date() }
  });

  return {
    token: jwt.sign(
      { sub: account.id, personId: person.id, companyId: company.id, role: "CLIENT" },
      jwtSecret,
      { expiresIn: "8h" }
    ),
    personName: person.legalName
  };
});

// Cobranças do cliente logado
app.get("/cliente/cobrancas", { preHandler: [authenticateClient] }, async (request) => {
  const { personId, companyId } = (request as any).clientUser;

  const [person, entries] = await Promise.all([
    prisma.person.findUnique({ where: { id: personId } }),
    prisma.financialEntry.findMany({
      where:   { companyId, direction: FinancialDirection.RECEIVABLE },
      orderBy: { dueDate: "asc" }
    })
  ]);

  // Filtra apenas cobranças relacionadas ao aluno via sourceId ou todas (demo)
  return { person, entries };
});

// Checkout MP para o portal do cliente
app.post("/cliente/pagar/:entryId/mp", { preHandler: [pciHeaders, authenticateClient], config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
  const { entryId }   = z.object({ entryId: z.string() }).parse(request.params);
  const { companyId } = (request as any).clientUser;
  const mpToken       = await getGatewayToken(companyId, "mp") ?? process.env.MP_ACCESS_TOKEN;
  if (!mpToken) return reply.code(501).send({ message: "Mercado Pago não configurado." });

  const entry = await prisma.financialEntry.findFirst({ where: { id: entryId, companyId } });
  if (!entry)                                   return reply.code(404).send({ message: "Cobrança não encontrada." });
  if (entry.status === FinancialStatus.SETTLED)  return reply.code(409).send({ message: "Esta cobrança já foi paga." });

  const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
  const mpRes  = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mpToken}` },
    body: JSON.stringify({
      items: [{ id: entry.id, title: entry.description, quantity: 1, unit_price: Number(entry.amount), currency_id: "BRL" }],
      back_urls: { success: `${webUrl}/cliente/pagar/${entryId}/confirmado`, failure: `${webUrl}/cliente/pagar/${entryId}?erro=mp`, pending: `${webUrl}/cliente/pagar/${entryId}/pendente` },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/payment/${entryId}/mp-webhook`,
      external_reference: entryId,
      statement_descriptor: "WINNER ACADEMIA"
    })
  });

  if (!mpRes.ok) { app.log.error(await mpRes.json().catch(() => ({})), "MP preference error"); return reply.code(502).send({ message: "Erro no gateway. Tente novamente." }); }
  const data = await mpRes.json();
  return { checkoutUrl: data.init_point, sandboxUrl: data.sandbox_init_point, gateway: "mercadopago" };
});

// Checkout PagSeguro para o portal do cliente
app.post("/cliente/pagar/:entryId/pagseguro", { preHandler: [pciHeaders, authenticateClient], config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
  const { entryId }   = z.object({ entryId: z.string() }).parse(request.params);
  const { companyId, personId } = (request as any).clientUser;
  const psSettings    = await prisma.companySettings.findUnique({ where: { companyId } });
  const psToken       = (psSettings?.psToken ? decryptToken(psSettings.psToken) : null) ?? process.env.PAGSEGURO_TOKEN;
  const psEnvDb       = psSettings?.psEnv ?? process.env.PAGSEGURO_ENV ?? "sandbox";
  if (!psToken) return reply.code(501).send({ message: "PagSeguro não configurado." });

  const entry  = await prisma.financialEntry.findFirst({ where: { id: entryId, companyId } });
  if (!entry)                                   return reply.code(404).send({ message: "Cobrança não encontrada." });
  if (entry.status === FinancialStatus.SETTLED)  return reply.code(409).send({ message: "Esta cobrança já foi paga." });

  const person = await prisma.person.findUnique({ where: { id: personId } });
  const isSandbox = psEnvDb === "sandbox";
  const psBase    = isSandbox ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";
  const webUrl    = process.env.WEB_URL ?? "http://localhost:3000";

  const psRes = await fetch(`${psBase}/checkouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${psToken}` },
    body: JSON.stringify({
      reference_id:  entryId,
      customer: {
        name:   person?.legalName ?? "Aluno",
        email:  person?.email ?? "aluno@winner.com.br",
        tax_id: person?.document ?? "00000000000"
      },
      items: [{ reference_id: entry.id, name: entry.description, quantity: 1, unit_amount: Math.round(Number(entry.amount) * 100) }],
      payment_methods: [{ type: "CREDIT_CARD" }, { type: "DEBIT_CARD" }, { type: "BOLETO" }, { type: "PIX" }],
      redirect_url: `${webUrl}/cliente/pagar/${entryId}/confirmado`,
      notification_urls: [`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/payment/pagseguro-webhook`]
    })
  });

  if (!psRes.ok) { app.log.error(await psRes.json().catch(() => ({})), "PagSeguro checkout error"); return reply.code(502).send({ message: "Erro no gateway. Tente novamente." }); }
  const data  = await psRes.json();
  const payUrl = (data.links ?? []).find((l: any) => l.rel === "PAY")?.href ?? data.payment_url;
  if (!payUrl) return reply.code(502).send({ message: "Não foi possível obter o link de pagamento." });
  return { checkoutUrl: payUrl, gateway: "pagseguro" };
});

// Webhook PagSeguro
app.post("/payment/pagseguro-webhook", async (request, reply) => {
  const body      = (request.body as any) ?? {};
  const orderId   = body.reference_id ?? body.id;
  const status    = body.charges?.[0]?.status ?? body.status;
  if (status !== "PAID" && status !== "AUTHORIZED") return reply.code(200).send({ ok: true });
  if (!orderId) return reply.code(200).send({ ok: true });

  const company = await getDemoCompany();
  await prisma.financialEntry.updateMany({
    where: { id: orderId, companyId: company.id, status: { not: FinancialStatus.SETTLED } },
    data:  { status: FinancialStatus.SETTLED, settledAmount: new Prisma.Decimal(body.charges?.[0]?.amount?.value ? body.charges[0].amount.value / 100 : 0) }
  });

  return reply.code(200).send({ ok: true });
});

// ── Configurações ─────────────────────────────────────────────────────────────

function encryptToken(text: string): string {
  const key = scryptSync(paymentLinkSecret!, "winnerconf", 32);
  const iv  = randomBytes(12);
  const c   = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return `${iv.toString("hex")}:${c.getAuthTag().toString("hex")}:${enc.toString("hex")}`;
}

function decryptToken(data: string): string {
  const [ivH, tagH, encH] = data.split(":");
  const key = scryptSync(paymentLinkSecret!, "winnerconf", 32);
  const d   = createDecipheriv("aes-256-gcm", key, Buffer.from(ivH, "hex"));
  d.setAuthTag(Buffer.from(tagH, "hex"));
  return Buffer.concat([d.update(Buffer.from(encH, "hex")), d.final()]).toString("utf8");
}

function maskToken(t: string | null | undefined): string | null {
  if (!t) return null;
  try { const plain = decryptToken(t); return `${plain.slice(0, 6)}...${plain.slice(-4)}`; }
  catch { return `${t.slice(0, 6)}...`; }
}

async function audit(
  companyId: string,
  action: string,
  entity: string,
  entityId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any = {},
  userId?: string | null
) {
  await prisma.auditLog.create({
    data: { companyId, action, entity, entityId, payload, userId: userId ?? null }
  }).catch(() => {/* non-blocking */});
}

async function getOrCreateSettings(companyId: string) {
  return prisma.companySettings.upsert({
    where:  { companyId },
    update: {},
    create: { companyId }
  });
}

// GET — log de eventos (master admin)
app.get("/settings/demo/logs", async (request) => {
  const { limit, offset, category } = z.object({
    limit:    z.coerce.number().min(1).max(500).default(100),
    offset:   z.coerce.number().min(0).default(0),
    category: z.string().optional()
  }).parse(request.query);

  const company = await getDemoCompany();

  const CATEGORIES: Record<string, string[]> = {
    pagamentos: ["PAGAMENTO_REALIZADO", "EXTRATO_IMPORTADO", "LANCAMENTO_CRIADO"],
    alunos:     ["ALUNO_CADASTRADO", "LOGIN_ALUNO", "AULA_AGENDADA"],
    usuarios:   ["USUARIO_CRIADO", "USUARIO_REMOVIDO", "SENHA_ALTERADA"],
    config:     ["CONFIG_EMPRESA", "CONFIG_PIX", "CONFIG_GATEWAYS"],
  };

  const actionFilter = category && CATEGORIES[category] ? { action: { in: CATEGORIES[category] } } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where:   { companyId: company.id, ...actionFilter },
      orderBy: { createdAt: "desc" },
      take:    limit,
      skip:    offset
    }),
    prisma.auditLog.count({ where: { companyId: company.id, ...actionFilter } })
  ]);

  return { logs, total, limit, offset };
});

// GET — todas as configurações (tokens mascarados)
app.get("/settings/demo", async () => {
  const company  = await getDemoCompany();
  const settings = await getOrCreateSettings(company.id);
  const users    = await prisma.user.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } });
  return {
    company: {
      legalName:    company.legalName,
      tradeName:    company.tradeName,
      cnpj:         company.cnpj,
      taxRegime:    company.taxRegime,
      address:      settings.address,
      phone:        settings.phone,
      email:        settings.email
    },
    pix: {
      pixKey:     settings.pixKey,
      pixKeyType: settings.pixKeyType
    },
    gateways: {
      mp:        { configured: !!settings.mpToken, masked: maskToken(settings.mpToken) },
      pagseguro: { configured: !!settings.psToken, masked: maskToken(settings.psToken), env: settings.psEnv }
    },
    users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }))
  };
});

// PUT — dados da empresa
app.put("/settings/demo/company", async (request) => {
  const body = z.object({
    tradeName: z.string().min(2).max(80).optional(),
    address:   z.string().max(200).optional().nullable(),
    phone:     z.string().max(20).optional().nullable(),
    email:     z.string().email().optional().nullable().or(z.literal(""))
  }).parse(request.body);

  const company  = await getDemoCompany();
  const oldSettings = await prisma.companySettings.findUnique({ where: { companyId: company.id } });
  await Promise.all([
    body.tradeName ? prisma.company.update({ where: { id: company.id }, data: { tradeName: body.tradeName } }) : Promise.resolve(),
    prisma.companySettings.upsert({
      where:  { companyId: company.id },
      update: { address: body.address ?? undefined, phone: body.phone ?? undefined, email: body.email || null },
      create: { companyId: company.id, address: body.address, phone: body.phone, email: body.email || null }
    })
  ]);
  await audit(company.id, "CONFIG_EMPRESA", "Company", company.id, {
    usuario: "admin@erp.local",
    de:   { nome: company.tradeName, endereco: oldSettings?.address ?? "-" },
    para: { nome: body.tradeName ?? company.tradeName, endereco: body.address ?? oldSettings?.address ?? "-" }
  });
  return { ok: true };
});

// PUT — chave PIX
app.put("/settings/demo/pix", async (request) => {
  const body = z.object({
    pixKey:     z.string().max(80),
    pixKeyType: z.enum(["EMAIL", "CNPJ", "CPF", "PHONE", "RANDOM"])
  }).parse(request.body);

  const company  = await getDemoCompany();
  const oldCfg   = await prisma.companySettings.findUnique({ where: { companyId: company.id } });
  await prisma.companySettings.upsert({
    where:  { companyId: company.id },
    update: { pixKey: body.pixKey, pixKeyType: body.pixKeyType },
    create: { companyId: company.id, pixKey: body.pixKey, pixKeyType: body.pixKeyType }
  });
  await audit(company.id, "CONFIG_PIX", "CompanySettings", company.id, {
    usuario: "admin@erp.local",
    de:   { chave: oldCfg?.pixKey ?? "não configurada", tipo: oldCfg?.pixKeyType ?? "-" },
    para: { chave: body.pixKey, tipo: body.pixKeyType }
  });
  return { ok: true };
});

// DELETE — chave PIX
app.delete("/settings/demo/pix", async () => {
  const company = await getDemoCompany();
  const oldCfg  = await prisma.companySettings.findUnique({ where: { companyId: company.id } });
  await prisma.companySettings.upsert({
    where:  { companyId: company.id },
    update: { pixKey: null, pixKeyType: null },
    create: { companyId: company.id }
  });
  await audit(company.id, "CONFIG_PIX", "CompanySettings", company.id, {
    usuario: "admin@erp.local",
    de:   { chave: oldCfg?.pixKey ?? "-", tipo: oldCfg?.pixKeyType ?? "-" },
    para: { chave: "removida", tipo: "-" }
  });
  return { ok: true };
});

// PUT — credenciais de gateways (armazena criptografado)
app.put("/settings/demo/gateways", async (request) => {
  const body = z.object({
    mpToken: z.string().min(10).optional().nullable().or(z.literal("")),
    psToken: z.string().min(10).optional().nullable().or(z.literal("")),
    psEnv:   z.enum(["sandbox", "production"]).optional()
  }).parse(request.body);

  const company = await getDemoCompany();
  await prisma.companySettings.upsert({
    where:  { companyId: company.id },
    update: {
      ...(body.mpToken !== undefined ? { mpToken: body.mpToken ? encryptToken(body.mpToken) : null } : {}),
      ...(body.psToken !== undefined ? { psToken: body.psToken ? encryptToken(body.psToken) : null } : {}),
      ...(body.psEnv ? { psEnv: body.psEnv } : {})
    },
    create: { companyId: company.id }
  });
  const gateways: string[] = [];
  if (body.mpToken) gateways.push("Mercado Pago");
  if (body.psToken) gateways.push("PagSeguro");
  await audit(company.id, "CONFIG_GATEWAYS", "CompanySettings", company.id, {
    usuario: "admin@erp.local",
    gateways_atualizados: gateways.length > 0 ? gateways.join(", ") : "nenhum token alterado",
    ambiente_pagseguro: body.psEnv ?? "sem alteração"
  });
  return { ok: true };
});

// GET — usuários admin
app.get("/settings/demo/users", async () => {
  const company = await getDemoCompany();
  const users = await prisma.user.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } });
  return users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }));
});

// POST — criar usuário admin
app.post("/settings/demo/users", {
  config: { rateLimit: { max: 10, timeWindow: "1 hour" } }
}, async (request, reply) => {
  const body = z.object({
    name:     z.string().min(3).max(80),
    email:    z.string().email(),
    password: z.string().min(6),
    role:     z.enum(["OWNER","ADMIN","FINANCE","MANAGER"]).default("ADMIN")
  }).parse(request.body);

  const company = await getDemoCompany();
  const existing = await prisma.user.findFirst({ where: { companyId: company.id, email: body.email } });
  if (existing) return reply.code(409).send({ message: "E-mail já cadastrado." });

  const hash = await bcrypt.hash(body.password, 12);
  const user  = await prisma.user.create({
    data: { companyId: company.id, name: body.name, email: body.email, passwordHash: hash, role: body.role as UserRole }
  });
  const ROLE_PT: Record<string, string> = { OWNER:"Master", ADMIN:"Administrador", FINANCE:"Financeiro", MANAGER:"Recepcionista" };
  await audit(company.id, "USUARIO_CRIADO", "User", user.id, {
    nome:   body.name,
    email:  body.email,
    perfil: ROLE_PT[body.role] ?? body.role,
    usuario: "admin@erp.local"
  });
  return { ok: true, userId: user.id };
});

// DELETE — remover usuário
app.delete("/settings/demo/users/:userId", async (request, reply) => {
  const { userId } = z.object({ userId: z.string() }).parse(request.params);
  const company    = await getDemoCompany();
  const user       = await prisma.user.findFirst({ where: { id: userId, companyId: company.id } });
  if (!user) return reply.code(404).send({ message: "Usuário não encontrado." });
  if (user.role === UserRole.OWNER) return reply.code(403).send({ message: "Não é possível remover o proprietário." });
  await prisma.user.delete({ where: { id: userId } });
  const ROLE_PT2: Record<string, string> = { OWNER:"Master", ADMIN:"Administrador", FINANCE:"Financeiro", MANAGER:"Recepcionista" };
  await audit(company.id, "USUARIO_REMOVIDO", "User", userId, {
    nome:   user.name,
    email:  user.email,
    perfil: ROLE_PT2[user.role] ?? user.role,
    usuario: "admin@erp.local"
  });
  return { ok: true };
});

// PUT — alterar senha
app.put("/settings/demo/password", {
  config: { rateLimit: { max: 5, timeWindow: "15 minutes" } }
}, async (request, reply) => {
  const body = z.object({
    email:       z.string().email(),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres")
  }).parse(request.body);

  const company = await getDemoCompany();
  const user    = await prisma.user.findFirst({ where: { companyId: company.id, email: body.email } });
  if (!user) return reply.code(404).send({ message: "Usuário não encontrado." });

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!valid) return reply.code(401).send({ message: "Senha atual incorreta." });

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.newPassword, 12) } });
  await audit(company.id, "SENHA_ALTERADA", "User", user.id, {
    email:   user.email,
    usuario: user.email,
    de:   { senha: "••••••••" },
    para: { senha: "••••••••" }
  });
  return { ok: true };
});

// Helper para rotas de gateway lerem token do banco (prioridade sobre .env)
async function getGatewayToken(companyId: string, gateway: "mp" | "ps"): Promise<string | null> {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  const encrypted = gateway === "mp" ? settings?.mpToken : settings?.psToken;
  if (!encrypted) return null;
  try { return decryptToken(encrypted); } catch { return null; }
}

app.listen({ port: 3001, host: "0.0.0.0" });
