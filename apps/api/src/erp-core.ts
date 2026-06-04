import {
  DocumentStatus,
  FinancialDirection,
  FinancialStatus,
  InventoryMovementType,
  InvoiceModel,
  PersonKind,
  Prisma,
  ProductionOrderStatus,
  prisma
} from "@erp/database";
import { z } from "zod";

export const salesOrderActionSchema = z.object({
  companyId: z.string(),
  customerId: z.string(),
  costCenterId: z.string(),
  taxRuleId: z.string(),
  warehouseId: z.string(),
  paymentTerms: z.string().min(1),
  productId: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  discount: z.coerce.number().min(0).default(0)
});

export const purchaseOrderActionSchema = z.object({
  companyId: z.string(),
  supplierId: z.string(),
  costCenterId: z.string(),
  taxRuleId: z.string(),
  warehouseId: z.string(),
  productId: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  documentNumber: z.string().min(1),
  xmlAccessKey: z.string().optional()
});

export const productionOrderActionSchema = z.object({
  companyId: z.string(),
  warehouseId: z.string(),
  productId: z.string(),
  quantity: z.coerce.number().positive()
});

export const taskActionSchema = z.object({
  companyId: z.string(),
  title: z.string().min(3),
  module: z.string().min(2),
  slaHours: z.coerce.number().int().positive(),
  assignee: z.string().optional()
});

export const productCreateSchema = z.object({
  companyId: z.string(),
  sku: z.string().min(2),
  name: z.string().min(3),
  type: z.string().min(2),
  unit: z.string().min(1),
  ncm: z.string().optional(),
  salePrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0).default(0),
  fiscalProfileId: z.string().optional()
});

export const personCreateSchema = z.object({
  companyId: z.string(),
  kind: z.enum(["CUSTOMER", "SUPPLIER"]),
  code: z.string().optional(),
  legalName: z.string().min(3),
  tradeName: z.string().optional(),
  document: z.string().min(5),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional()
});

export const warehouseCreateSchema = z.object({
  companyId: z.string(),
  code: z.string().min(2),
  name: z.string().min(3)
});

export const costCenterCreateSchema = z.object({
  companyId: z.string(),
  code: z.string().min(2),
  name: z.string().min(3),
  dreGroup: z.string().min(3)
});

export const taxRuleCreateSchema = z.object({
  companyId: z.string(),
  code: z.string().min(2),
  name: z.string().min(3),
  operationType: z.enum(["SALE", "PURCHASE"]),
  cfopInternal: z.string().optional(),
  cstIcms: z.string().optional(),
  cstPis: z.string().optional(),
  cstCofins: z.string().optional(),
  icmsRate: z.coerce.number().min(0).default(0),
  pisRate: z.coerce.number().min(0).default(0),
  cofinsRate: z.coerce.number().min(0).default(0),
  issRate: z.coerce.number().min(0).default(0),
  ipiRate: z.coerce.number().min(0).default(0)
});

export const bomCreateSchema = z.object({
  companyId: z.string(),
  productId: z.string(),
  componentId: z.string(),
  code: z.string().min(3),
  version: z.string().min(1),
  quantity: z.coerce.number().positive()
});

type SalesOrderFlowPayload = {
  companyId: string;
  customerId: string;
  costCenterId: string;
  taxRuleId: string;
  warehouseId: string;
  paymentTerms: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
};

type PurchaseOrderFlowPayload = {
  companyId: string;
  supplierId: string;
  costCenterId: string;
  taxRuleId: string;
  warehouseId: string;
  documentNumber: string;
  xmlAccessKey?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type ProductionFlowPayload = {
  companyId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
};

const money = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);

function nextCode(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export async function getDemoCompany() {
  return prisma.company.findFirstOrThrow();
}

export async function writeAudit(
  companyId: string,
  userId: string | undefined,
  entity: string,
  entityId: string,
  action: string,
  payload: unknown,
  tx: Prisma.TransactionClient = prisma
) {
  await tx.auditLog.create({
    data: {
      companyId,
      userId,
      entity,
      entityId,
      action,
      payload: payload as Prisma.InputJsonValue
    }
  });
}

function splitInstallments(total: Prisma.Decimal, paymentTerms: string) {
  const days = paymentTerms
    .split("/")
    .map((value) => Number(value.replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));

  const normalizedDays = days.length > 0 ? days : [0];
  const parcels = normalizedDays.length;
  const baseValue = total.div(parcels).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
  const values = normalizedDays.map((_, index) => (
    index === normalizedDays.length - 1
      ? total.minus(baseValue.mul(parcels - 1))
      : baseValue
  ));

  return normalizedDays.map((day, index) => ({
    dueDate: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
    amount: values[index]
  }));
}

function calculateTaxes(total: Prisma.Decimal, taxRule: {
  icmsRate: Prisma.Decimal | null;
  pisRate: Prisma.Decimal | null;
  cofinsRate: Prisma.Decimal | null;
  issRate: Prisma.Decimal | null;
  ipiRate: Prisma.Decimal | null;
}) {
  const percent = (rate: Prisma.Decimal | null) => total.mul(rate ?? 0).div(100).toDecimalPlaces(2);

  return {
    totalIcms: percent(taxRule.icmsRate),
    totalPis: percent(taxRule.pisRate),
    totalCofins: percent(taxRule.cofinsRate),
    totalIss: percent(taxRule.issRate),
    totalIpi: percent(taxRule.ipiRate)
  };
}

export async function createProduct(input: z.infer<typeof productCreateSchema>, userId?: string) {
  const product = await prisma.product.create({
    data: {
      companyId: input.companyId,
      sku: input.sku,
      name: input.name,
      type: input.type,
      unit: input.unit,
      ncm: input.ncm || undefined,
      salePrice: money(input.salePrice),
      costPrice: money(input.costPrice),
      minStock: money(input.minStock),
      fiscalProfileId: input.fiscalProfileId || undefined
    }
  });

  await writeAudit(input.companyId, userId, "Product", product.id, "CREATE_PRODUCT", {
    sku: product.sku,
    name: product.name
  });

  return product;
}

export async function createPerson(input: z.infer<typeof personCreateSchema>, userId?: string) {
  const person = await prisma.person.create({
    data: {
      companyId: input.companyId,
      code: input.code || undefined,
      legalName: input.legalName,
      tradeName: input.tradeName || undefined,
      document: input.document,
      email: input.email || undefined,
      phone: input.phone || undefined,
      city: input.city || undefined,
      state: input.state || undefined,
      kinds: [PersonKind[input.kind]]
    }
  });

  await writeAudit(input.companyId, userId, "Person", person.id, `CREATE_${input.kind}`, {
    legalName: person.legalName,
    document: person.document
  });

  return person;
}

export async function createWarehouse(input: z.infer<typeof warehouseCreateSchema>, userId?: string) {
  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: input.companyId,
      code: input.code,
      name: input.name
    }
  });

  await writeAudit(input.companyId, userId, "Warehouse", warehouse.id, "CREATE_WAREHOUSE", {
    code: warehouse.code,
    name: warehouse.name
  });

  return warehouse;
}

export async function createCostCenter(input: z.infer<typeof costCenterCreateSchema>, userId?: string) {
  const center = await prisma.costCenter.create({
    data: {
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      dreGroup: input.dreGroup
    }
  });

  await writeAudit(input.companyId, userId, "CostCenter", center.id, "CREATE_COST_CENTER", {
    code: center.code,
    dreGroup: center.dreGroup
  });

  return center;
}

export async function createTaxRule(input: z.infer<typeof taxRuleCreateSchema>, userId?: string) {
  const taxRule = await prisma.taxRule.create({
    data: {
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      operationType: input.operationType,
      cfopInternal: input.cfopInternal || undefined,
      cstIcms: input.cstIcms || undefined,
      cstPis: input.cstPis || undefined,
      cstCofins: input.cstCofins || undefined,
      icmsRate: money(input.icmsRate),
      pisRate: money(input.pisRate),
      cofinsRate: money(input.cofinsRate),
      issRate: money(input.issRate),
      ipiRate: money(input.ipiRate)
    }
  });

  await writeAudit(input.companyId, userId, "TaxRule", taxRule.id, "CREATE_TAX_RULE", {
    code: taxRule.code,
    operationType: taxRule.operationType
  });

  return taxRule;
}

export async function createBom(input: z.infer<typeof bomCreateSchema>, userId?: string) {
  const bom = await prisma.billOfMaterial.upsert({
    where: {
      companyId_code_version: {
        companyId: input.companyId,
        code: input.code,
        version: input.version
      }
    },
    update: {
      productId: input.productId,
      items: {
        deleteMany: {},
        create: [
          {
            componentId: input.componentId,
            quantity: money(input.quantity),
            sequence: 10
          }
        ]
      }
    },
    create: {
      companyId: input.companyId,
      productId: input.productId,
      code: input.code,
      version: input.version,
      items: {
        create: [
          {
            componentId: input.componentId,
            quantity: money(input.quantity),
            sequence: 10
          }
        ]
      }
    },
    include: {
      items: true
    }
  });

  await writeAudit(input.companyId, userId, "BillOfMaterial", bom.id, "UPSERT_BOM", {
    productId: input.productId,
    componentId: input.componentId,
    quantity: input.quantity
  });

  return bom;
}

export async function createTask(input: z.infer<typeof taskActionSchema>, userId?: string) {
  const dueAt = new Date(Date.now() + input.slaHours * 60 * 60 * 1000);
  const task = await prisma.task.create({
    data: {
      companyId: input.companyId,
      title: input.title,
      module: input.module,
      slaHours: input.slaHours,
      assignee: input.assignee,
      status: "OPEN",
      dueAt
    }
  });

  await writeAudit(input.companyId, userId, "Task", task.id, "CREATE_TASK", {
    module: task.module,
    dueAt
  });

  return task;
}

async function upsertInventory(
  companyId: string,
  warehouseId: string,
  productId: string,
  quantityDelta: Prisma.Decimal,
  unitCost: Prisma.Decimal,
  type: InventoryMovementType,
  referenceType: string,
  referenceId: string,
  tx: Prisma.TransactionClient
) {
  const current = await tx.inventoryBalance.findUnique({
    where: {
      warehouseId_productId_batchCode: {
        warehouseId,
        productId,
        batchCode: ""
      }
    }
  });

  const currentQuantity = current?.quantity ?? new Prisma.Decimal(0);
  const nextQuantity = currentQuantity.plus(quantityDelta);

  if (nextQuantity.lessThan(0)) {
    throw new Error(`Saldo insuficiente para o produto ${productId}`);
  }

  const averageCost = quantityDelta.greaterThan(0)
    ? (
      current
        ? current.averageCost.mul(currentQuantity).plus(unitCost.mul(quantityDelta)).div(nextQuantity)
        : unitCost
    ).toDecimalPlaces(4)
    : current?.averageCost ?? unitCost;

  await tx.inventoryBalance.upsert({
    where: {
      warehouseId_productId_batchCode: {
        warehouseId,
        productId,
        batchCode: ""
      }
    },
    update: {
      quantity: nextQuantity,
      averageCost
    },
    create: {
      companyId,
      warehouseId,
      productId,
      quantity: nextQuantity,
      averageCost
    }
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      companyId,
      warehouseId,
      productId,
      type,
      quantity: quantityDelta,
      unitCost,
      referenceType,
      referenceId
    }
  });

  await writeAudit(companyId, undefined, "InventoryMovement", movement.id, "REGISTER_STOCK_MOVEMENT", {
    productId,
    warehouseId,
    type,
    quantity: quantityDelta.toString(),
    referenceType,
    referenceId
  }, tx);
}

export async function createSalesOrderFlow(body: SalesOrderFlowPayload, userId?: string) {
  const totalGross = body.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = body.items.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  const totalNet = totalGross - totalDiscount;

  return prisma.$transaction(async (tx) => {
    const taxRule = await tx.taxRule.findUniqueOrThrow({ where: { id: body.taxRuleId } });
    const created = await tx.salesOrder.create({
      data: {
        companyId: body.companyId,
        customerId: body.customerId,
        costCenterId: body.costCenterId,
        taxRuleId: body.taxRuleId,
        code: nextCode("PV"),
        paymentTerms: body.paymentTerms,
        status: DocumentStatus.APPROVED,
        totalGross: money(totalGross),
        totalDiscount: money(totalDiscount),
        totalNet: money(totalNet),
        items: {
          create: body.items.map((item) => ({
            productId: item.productId,
            quantity: money(item.quantity),
            unitPrice: money(item.unitPrice),
            discount: money(item.discount ?? 0),
            total: money(item.quantity * item.unitPrice - (item.discount ?? 0))
          }))
        }
      },
      include: { items: true }
    });

    for (const item of body.items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      await upsertInventory(
        body.companyId,
        body.warehouseId,
        item.productId,
        money(-item.quantity),
        product.costPrice,
        InventoryMovementType.OUTBOUND,
        "SALES_ORDER",
        created.id,
        tx
      );
    }

    const taxes = calculateTaxes(money(totalNet), taxRule);
    const invoice = await tx.fiscalInvoice.create({
      data: {
        companyId: body.companyId,
        taxRuleId: body.taxRuleId,
        salesOrderId: created.id,
        model: InvoiceModel.NFE,
        status: DocumentStatus.AUTHORIZED,
        number: `${Date.now()}`,
        series: "1",
        operationNature: "Venda de mercadoria",
        totalProducts: money(totalGross),
        totalInvoice: money(totalNet),
        ...taxes
      }
    });

    const parcels = splitInstallments(money(totalNet), body.paymentTerms);
    const entries = await Promise.all(parcels.map((parcel, index) => (
      tx.financialEntry.create({
        data: {
          companyId: body.companyId,
          costCenterId: body.costCenterId,
          salesOrderId: created.id,
          direction: FinancialDirection.RECEIVABLE,
          category: "VENDAS",
          sourceType: "SALES_ORDER",
          sourceId: created.id,
          description: `Parcela ${index + 1}/${parcels.length} ${created.code}`,
          amount: parcel.amount,
          dueDate: parcel.dueDate,
          competenceDate: new Date()
        }
      })
    )));

    await writeAudit(body.companyId, userId, "SalesOrder", created.id, "ISSUE_ORDER", {
      totalNet,
      paymentTerms: body.paymentTerms
    }, tx);
    await writeAudit(body.companyId, userId, "FiscalInvoice", invoice.id, "AUTHORIZE_OUTBOUND_INVOICE", {
      source: created.code,
      number: invoice.number
    }, tx);

    for (const entry of entries) {
      await writeAudit(body.companyId, userId, "FinancialEntry", entry.id, "CREATE_RECEIVABLE", {
        sourceId: created.id,
        amount: entry.amount
      }, tx);
    }

    return created;
  });
}

export async function createPurchaseOrderFlow(body: PurchaseOrderFlowPayload, userId?: string) {
  const total = body.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return prisma.$transaction(async (tx) => {
    const taxRule = await tx.taxRule.findUniqueOrThrow({ where: { id: body.taxRuleId } });
    const created = await tx.purchaseOrder.create({
      data: {
        companyId: body.companyId,
        supplierId: body.supplierId,
        costCenterId: body.costCenterId,
        taxRuleId: body.taxRuleId,
        xmlAccessKey: body.xmlAccessKey,
        code: nextCode("PC"),
        status: DocumentStatus.CLOSED,
        totalGross: money(total),
        totalNet: money(total),
        items: {
          create: body.items.map((item) => ({
            productId: item.productId,
            quantity: money(item.quantity),
            unitPrice: money(item.unitPrice),
            total: money(item.quantity * item.unitPrice)
          }))
        }
      },
      include: { items: true }
    });

    for (const item of body.items) {
      await upsertInventory(
        body.companyId,
        body.warehouseId,
        item.productId,
        money(item.quantity),
        money(item.unitPrice),
        InventoryMovementType.INBOUND,
        "PURCHASE_ORDER",
        created.id,
        tx
      );
    }

    const payable = await tx.financialEntry.create({
      data: {
        companyId: body.companyId,
        costCenterId: body.costCenterId,
        purchaseOrderId: created.id,
        direction: FinancialDirection.PAYABLE,
        category: "COMPRAS",
        sourceType: "PURCHASE_ORDER",
        sourceId: created.id,
        description: `Fornecedor ${created.code}`,
        amount: money(total),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        competenceDate: new Date()
      }
    });

    const taxes = calculateTaxes(money(total), taxRule);
    const invoice = await tx.fiscalInvoice.create({
      data: {
        companyId: body.companyId,
        taxRuleId: body.taxRuleId,
        purchaseOrderId: created.id,
        model: InvoiceModel.NFE,
        status: DocumentStatus.AUTHORIZED,
        number: body.documentNumber,
        series: "1",
        operationNature: "Compra para industrializacao",
        accessKey: body.xmlAccessKey,
        totalProducts: money(total),
        totalInvoice: money(total),
        ...taxes
      }
    });

    await writeAudit(body.companyId, userId, "PurchaseOrder", created.id, "RECEIVE_PURCHASE", {
      total,
      documentNumber: body.documentNumber
    }, tx);
    await writeAudit(body.companyId, userId, "FiscalInvoice", invoice.id, "REGISTER_INBOUND_INVOICE", {
      source: created.code,
      number: invoice.number
    }, tx);
    await writeAudit(body.companyId, userId, "FinancialEntry", payable.id, "CREATE_PAYABLE", {
      sourceId: created.id,
      amount: payable.amount
    }, tx);

    return created;
  });
}

export async function createProductionFlow(body: ProductionFlowPayload, userId?: string) {
  const bom = await prisma.billOfMaterial.findFirstOrThrow({
    where: { companyId: body.companyId, productId: body.productId },
    include: { items: true }
  });

  return prisma.$transaction(async (tx) => {
    const created = await tx.productionOrder.create({
      data: {
        companyId: body.companyId,
        productId: body.productId,
        warehouseId: body.warehouseId,
        code: nextCode("OP"),
        status: ProductionOrderStatus.FINISHED,
        quantityPlanned: money(body.quantity),
        quantityProduced: money(body.quantity),
        startedAt: new Date(),
        finishedAt: new Date()
      }
    });

    for (const item of bom.items) {
      const component = await tx.product.findUniqueOrThrow({ where: { id: item.componentId } });
      await upsertInventory(
        body.companyId,
        body.warehouseId,
        item.componentId,
        money(-Number(item.quantity) * body.quantity),
        component.costPrice,
        InventoryMovementType.PRODUCTION_CONSUMPTION,
        "PRODUCTION_ORDER",
        created.id,
        tx
      );
    }

    const finishedProduct = await tx.product.findUniqueOrThrow({ where: { id: body.productId } });
    await upsertInventory(
      body.companyId,
      body.warehouseId,
      body.productId,
      money(body.quantity),
      finishedProduct.costPrice,
      InventoryMovementType.PRODUCTION_FINISHED,
      "PRODUCTION_ORDER",
      created.id,
      tx
    );

    await writeAudit(body.companyId, userId, "ProductionOrder", created.id, "FINISH_ORDER", {
      bomId: bom.id,
      quantity: body.quantity
    }, tx);

    return created;
  });
}

export async function listMasterData(companyId: string) {
  const [customers, suppliers, warehouses, products, taxRules, costCenters, boms] = await Promise.all([
    prisma.person.findMany({ where: { companyId, kinds: { has: "CUSTOMER" } }, orderBy: { legalName: "asc" } }),
    prisma.person.findMany({ where: { companyId, kinds: { has: "SUPPLIER" } }, orderBy: { legalName: "asc" } }),
    prisma.warehouse.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.taxRule.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.costCenter.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.billOfMaterial.findMany({
      where: { companyId },
      include: { product: true, items: { include: { component: true } } },
      orderBy: { code: "asc" }
    })
  ]);

  return { customers, suppliers, warehouses, products, taxRules, costCenters, boms };
}

export async function computeOverview(companyId: string) {
  const [
    receivables,
    payables,
    salesOrders,
    purchaseOrders,
    invoices,
    inventory,
    productionOrders,
    tasks,
    financialEntries,
    auditLogs
  ] = await Promise.all([
    prisma.financialEntry.aggregate({
      where: { companyId, direction: FinancialDirection.RECEIVABLE, status: { in: [FinancialStatus.OPEN, FinancialStatus.PARTIALLY_SETTLED] } },
      _sum: { amount: true }
    }),
    prisma.financialEntry.aggregate({
      where: { companyId, direction: FinancialDirection.PAYABLE, status: { in: [FinancialStatus.OPEN, FinancialStatus.PARTIALLY_SETTLED] } },
      _sum: { amount: true }
    }),
    prisma.salesOrder.findMany({
      where: { companyId },
      include: { customer: true, items: { include: { product: true } }, invoice: true, financialEntries: true },
      orderBy: { issueDate: "desc" },
      take: 6
    }),
    prisma.purchaseOrder.findMany({
      where: { companyId },
      include: { supplier: true, items: { include: { product: true } }, financialEntries: true, invoice: true },
      orderBy: { issueDate: "desc" },
      take: 6
    }),
    prisma.fiscalInvoice.findMany({
      where: { companyId },
      orderBy: { number: "desc" },
      take: 8
    }),
    prisma.inventoryBalance.findMany({
      where: { companyId },
      include: { product: true, warehouse: true },
      orderBy: { quantity: "asc" },
      take: 10
    }),
    prisma.productionOrder.findMany({
      where: { companyId },
      include: { product: true, warehouse: true },
      orderBy: { startedAt: "desc" },
      take: 6
    }),
    prisma.task.findMany({
      where: { companyId },
      orderBy: { dueAt: "asc" },
      take: 6
    }),
    prisma.financialEntry.findMany({
      where: { companyId },
      orderBy: { dueDate: "asc" },
      take: 10
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  return {
    receivables: receivables._sum.amount ?? 0,
    payables: payables._sum.amount ?? 0,
    salesOrders,
    purchaseOrders,
    invoices,
    inventory,
    productionOrders,
    tasks,
    financialEntries,
    auditLogs
  };
}
