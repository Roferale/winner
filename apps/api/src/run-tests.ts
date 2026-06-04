import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  FinancialDirection,
  InventoryMovementType,
  PersonKind,
  prisma
} from "@erp/database";
import {
  createBom,
  createCostCenter,
  createPerson,
  createProduct,
  createProductionFlow,
  createPurchaseOrderFlow,
  createSalesOrderFlow,
  createWarehouse,
  getDemoCompany
} from "./erp-core.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, "../../../.env") });

type TestCase = {
  name: string;
  run: () => Promise<void>;
};

function suffix(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function documentNumber(prefix: string) {
  return suffix(prefix).replace(/\D/g, "").slice(0, 14);
}

async function baseIds() {
  const company = await getDemoCompany();
  const [saleRule, purchaseRule, salesCenter, purchaseCenter] = await Promise.all([
    prisma.taxRule.findFirstOrThrow({ where: { companyId: company.id, operationType: "SALE" } }),
    prisma.taxRule.findFirstOrThrow({ where: { companyId: company.id, operationType: "PURCHASE" } }),
    prisma.costCenter.findFirstOrThrow({ where: { companyId: company.id, code: "CC-VEND" } }),
    prisma.costCenter.findFirstOrThrow({ where: { companyId: company.id, code: "CC-COMP" } })
  ]);

  return { company, saleRule, purchaseRule, salesCenter, purchaseCenter };
}

const tests: TestCase[] = [
  {
    name: "cria produto",
    run: async () => {
      const { company, saleRule } = await baseIds();
      const code = suffix("PRD");
      const product = await createProduct({
        companyId: company.id,
        sku: code,
        name: `Produto ${code}`,
        type: "FINISHED_GOOD",
        unit: "UN",
        salePrice: 125,
        costPrice: 70,
        minStock: 3,
        fiscalProfileId: saleRule.id
      });

      assert.equal(product.sku, code);
    }
  },
  {
    name: "cria cliente",
    run: async () => {
      const { company } = await baseIds();
      const customer = await createPerson({
        companyId: company.id,
        kind: "CUSTOMER",
        legalName: `Cliente ${suffix("CLI")}`,
        document: documentNumber("101"),
        city: "Sao Paulo",
        state: "SP"
      });

      assert.ok(customer.kinds.includes(PersonKind.CUSTOMER));
    }
  },
  {
    name: "cria fornecedor",
    run: async () => {
      const { company } = await baseIds();
      const supplier = await createPerson({
        companyId: company.id,
        kind: "SUPPLIER",
        legalName: `Fornecedor ${suffix("FOR")}`,
        document: documentNumber("202"),
        city: "Campinas",
        state: "SP"
      });

      assert.ok(supplier.kinds.includes(PersonKind.SUPPLIER));
    }
  },
  {
    name: "cria deposito",
    run: async () => {
      const { company } = await baseIds();
      const code = suffix("DEP");
      const warehouse = await createWarehouse({
        companyId: company.id,
        code,
        name: `Deposito ${code}`
      });

      assert.equal(warehouse.code, code);
    }
  },
  {
    name: "registra compra com reflexo em fiscal, financeiro e estoque",
    run: async () => {
      const { company, purchaseRule, purchaseCenter } = await baseIds();
      const supplier = await createPerson({
        companyId: company.id,
        kind: "SUPPLIER",
        legalName: `Fornecedor Compra ${suffix("SUP")}`,
        document: documentNumber("303")
      });
      const warehouse = await createWarehouse({
        companyId: company.id,
        code: suffix("DCP"),
        name: "Deposito Compra Teste"
      });
      const product = await createProduct({
        companyId: company.id,
        sku: suffix("MP"),
        name: "Materia Prima Compra",
        type: "RAW_MATERIAL",
        unit: "KG",
        salePrice: 0,
        costPrice: 10,
        minStock: 0
      });

      const purchase = await createPurchaseOrderFlow({
        companyId: company.id,
        supplierId: supplier.id,
        costCenterId: purchaseCenter.id,
        taxRuleId: purchaseRule.id,
        warehouseId: warehouse.id,
        documentNumber: suffix("NF"),
        items: [{ productId: product.id, quantity: 15, unitPrice: 12.5 }]
      });

      const [invoice, payable, balance] = await Promise.all([
        prisma.fiscalInvoice.findUniqueOrThrow({ where: { purchaseOrderId: purchase.id } }),
        prisma.financialEntry.findFirstOrThrow({ where: { purchaseOrderId: purchase.id, direction: FinancialDirection.PAYABLE } }),
        prisma.inventoryBalance.findFirstOrThrow({ where: { warehouseId: warehouse.id, productId: product.id } })
      ]);

      assert.equal(invoice.purchaseOrderId, purchase.id);
      assert.equal(payable.direction, FinancialDirection.PAYABLE);
      assert.equal(Number(balance.quantity), 15);
    }
  },
  {
    name: "registra venda com reflexo em fiscal, financeiro e estoque",
    run: async () => {
      const { company, saleRule, purchaseRule, salesCenter, purchaseCenter } = await baseIds();
      const customer = await createPerson({
        companyId: company.id,
        kind: "CUSTOMER",
        legalName: `Cliente Venda ${suffix("CLI")}`,
        document: documentNumber("404")
      });
      const supplier = await createPerson({
        companyId: company.id,
        kind: "SUPPLIER",
        legalName: `Fornecedor Venda ${suffix("SUP")}`,
        document: documentNumber("505")
      });
      const warehouse = await createWarehouse({
        companyId: company.id,
        code: suffix("DVE"),
        name: "Deposito Venda Teste"
      });
      const product = await createProduct({
        companyId: company.id,
        sku: suffix("PA"),
        name: "Produto Venda",
        type: "FINISHED_GOOD",
        unit: "UN",
        salePrice: 150,
        costPrice: 80,
        minStock: 0,
        fiscalProfileId: saleRule.id
      });

      await createPurchaseOrderFlow({
        companyId: company.id,
        supplierId: supplier.id,
        costCenterId: purchaseCenter.id,
        taxRuleId: purchaseRule.id,
        warehouseId: warehouse.id,
        documentNumber: suffix("NFE"),
        items: [{ productId: product.id, quantity: 20, unitPrice: 80 }]
      });

      const sale = await createSalesOrderFlow({
        companyId: company.id,
        customerId: customer.id,
        costCenterId: salesCenter.id,
        taxRuleId: saleRule.id,
        warehouseId: warehouse.id,
        paymentTerms: "30/60",
        items: [{ productId: product.id, quantity: 5, unitPrice: 150 }]
      });

      const [invoice, receivables, balance, movements] = await Promise.all([
        prisma.fiscalInvoice.findUniqueOrThrow({ where: { salesOrderId: sale.id } }),
        prisma.financialEntry.findMany({ where: { salesOrderId: sale.id, direction: FinancialDirection.RECEIVABLE } }),
        prisma.inventoryBalance.findFirstOrThrow({ where: { warehouseId: warehouse.id, productId: product.id } }),
        prisma.inventoryMovement.findMany({ where: { referenceId: sale.id } })
      ]);

      assert.equal(invoice.salesOrderId, sale.id);
      assert.equal(receivables.length, 2);
      assert.equal(Number(balance.quantity), 15);
      assert.ok(movements.some((movement) => movement.type === InventoryMovementType.OUTBOUND));
    }
  },
  {
    name: "consome insumo e gera acabado ao encerrar OP",
    run: async () => {
      const { company, purchaseRule, purchaseCenter } = await baseIds();
      const supplier = await createPerson({
        companyId: company.id,
        kind: "SUPPLIER",
        legalName: `Fornecedor Producao ${suffix("SUP")}`,
        document: documentNumber("606")
      });
      const warehouse = await createWarehouse({
        companyId: company.id,
        code: suffix("DPR"),
        name: "Deposito Producao Teste"
      });
      const component = await createProduct({
        companyId: company.id,
        sku: suffix("CMP"),
        name: "Componente Producao",
        type: "RAW_MATERIAL",
        unit: "KG",
        salePrice: 0,
        costPrice: 10,
        minStock: 0
      });
      const finished = await createProduct({
        companyId: company.id,
        sku: suffix("FAB"),
        name: "Acabado Producao",
        type: "FINISHED_GOOD",
        unit: "UN",
        salePrice: 200,
        costPrice: 60,
        minStock: 0
      });

      await createBom({
        companyId: company.id,
        productId: finished.id,
        componentId: component.id,
        code: suffix("BOM"),
        version: "1.0",
        quantity: 2
      });

      await createPurchaseOrderFlow({
        companyId: company.id,
        supplierId: supplier.id,
        costCenterId: purchaseCenter.id,
        taxRuleId: purchaseRule.id,
        warehouseId: warehouse.id,
        documentNumber: suffix("NFP"),
        items: [{ productId: component.id, quantity: 50, unitPrice: 10 }]
      });

      const order = await createProductionFlow({
        companyId: company.id,
        productId: finished.id,
        warehouseId: warehouse.id,
        quantity: 10
      });

      const [componentBalance, finishedBalance, movements] = await Promise.all([
        prisma.inventoryBalance.findFirstOrThrow({ where: { warehouseId: warehouse.id, productId: component.id } }),
        prisma.inventoryBalance.findFirstOrThrow({ where: { warehouseId: warehouse.id, productId: finished.id } }),
        prisma.inventoryMovement.findMany({ where: { referenceId: order.id } })
      ]);

      assert.equal(Number(componentBalance.quantity), 30);
      assert.equal(Number(finishedBalance.quantity), 10);
      assert.ok(movements.some((movement) => movement.type === InventoryMovementType.PRODUCTION_CONSUMPTION));
      assert.ok(movements.some((movement) => movement.type === InventoryMovementType.PRODUCTION_FINISHED));
    }
  },
  {
    name: "compra e venda refletem nos modulos integrados e auditoria",
    run: async () => {
      const { company, saleRule, purchaseRule, purchaseCenter } = await baseIds();
      const product = await createProduct({
        companyId: company.id,
        sku: suffix("INT"),
        name: "Produto Integracao",
        type: "FINISHED_GOOD",
        unit: "UN",
        salePrice: 90,
        costPrice: 45,
        minStock: 0,
        fiscalProfileId: saleRule.id
      });
      const supplier = await createPerson({
        companyId: company.id,
        kind: "SUPPLIER",
        legalName: `Fornecedor Integracao ${suffix("SUP")}`,
        document: documentNumber("707")
      });
      const customer = await createPerson({
        companyId: company.id,
        kind: "CUSTOMER",
        legalName: `Cliente Integracao ${suffix("CLI")}`,
        document: documentNumber("808")
      });
      const warehouse = await createWarehouse({
        companyId: company.id,
        code: suffix("DIN"),
        name: "Deposito Integracao"
      });
      const center = await createCostCenter({
        companyId: company.id,
        code: suffix("CCI"),
        name: "Centro Integracao",
        dreGroup: "Receita"
      });

      const purchase = await createPurchaseOrderFlow({
        companyId: company.id,
        supplierId: supplier.id,
        costCenterId: purchaseCenter.id,
        taxRuleId: purchaseRule.id,
        warehouseId: warehouse.id,
        documentNumber: suffix("NFI"),
        items: [{ productId: product.id, quantity: 8, unitPrice: 45 }]
      });

      const sale = await createSalesOrderFlow({
        companyId: company.id,
        customerId: customer.id,
        costCenterId: center.id,
        taxRuleId: saleRule.id,
        warehouseId: warehouse.id,
        paymentTerms: "15/30",
        items: [{ productId: product.id, quantity: 3, unitPrice: 90 }]
      });

      const [purchaseInvoice, saleInvoice, titles, auditEvents] = await Promise.all([
        prisma.fiscalInvoice.findUniqueOrThrow({ where: { purchaseOrderId: purchase.id } }),
        prisma.fiscalInvoice.findUniqueOrThrow({ where: { salesOrderId: sale.id } }),
        prisma.financialEntry.findMany({ where: { sourceId: { in: [purchase.id, sale.id] } } }),
        prisma.auditLog.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" }, take: 30 })
      ]);

      assert.ok(purchaseInvoice.purchaseOrderId);
      assert.ok(saleInvoice.salesOrderId);
      assert.ok(titles.some((entry) => entry.direction === FinancialDirection.PAYABLE));
      assert.ok(titles.some((entry) => entry.direction === FinancialDirection.RECEIVABLE));
      assert.ok(auditEvents.some((event) => event.action === "RECEIVE_PURCHASE"));
      assert.ok(auditEvents.some((event) => event.action === "ISSUE_ORDER"));
    }
  }
];

async function main() {
  let failures = 0;

  for (const testCase of tests) {
    try {
      await testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${testCase.name}`);
      console.error(error);
    }
  }

  await prisma.$disconnect();

  if (failures > 0) {
    process.exitCode = 1;
    throw new Error(`${failures} teste(s) falharam`);
  }

  console.log(`OK ${tests.length} testes executados`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
