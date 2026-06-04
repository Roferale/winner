import {
  CompanyTaxRegime,
  DocumentStatus,
  FinancialDirection,
  InvoiceModel,
  PersonKind,
  Prisma,
  PrismaClient,
  UserRole
} from "@prisma/client";
// BookingStatus not needed in seed (no bookings to seed)
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "winner@2024";

async function main() {
  const company = await prisma.company.upsert({
    where: { cnpj: "12345678000199" },
    update: { legalName: "Winner Academia LTDA", tradeName: "Winner Academia" },
    create: {
      legalName: "Winner Academia LTDA",
      tradeName: "Winner Academia",
      cnpj: "12345678000199",
      taxRegime: CompanyTaxRegime.LUCRO_PRESUMIDO
    }
  });

  const [customer, supplier, employeePerson] = await Promise.all([
    prisma.person.upsert({
      where: { companyId_document: { companyId: company.id, document: "98765432000110" } },
      update: { legalName: "Beneficios Corporativos SA", tradeName: "BeneCorp" },
      create: {
        companyId: company.id,
        legalName: "Beneficios Corporativos SA",
        tradeName: "BeneCorp",
        document: "98765432000110",
        city: "Sao Paulo",
        state: "SP",
        kinds: [PersonKind.CUSTOMER]
      }
    }),
    prisma.person.upsert({
      where: { companyId_document: { companyId: company.id, document: "11122233000144" } },
      update: { legalName: "Sport Tennis Equipamentos LTDA", tradeName: "SportTennis" },
      create: {
        companyId: company.id,
        legalName: "Sport Tennis Equipamentos LTDA",
        tradeName: "SportTennis",
        document: "11122233000144",
        city: "Campinas",
        state: "SP",
        kinds: [PersonKind.SUPPLIER]
      }
    }),
    prisma.person.upsert({
      where: { companyId_document: { companyId: company.id, document: "12345678901" } },
      update: { legalName: "Carlos Eduardo Santos" },
      create: {
        companyId: company.id,
        legalName: "Carlos Eduardo Santos",
        document: "12345678901",
        city: "Sao Paulo",
        state: "SP",
        kinds: [PersonKind.EMPLOYEE]
      }
    })
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: "admin@erp.local" } },
    update: { passwordHash },
    create: {
      companyId: company.id,
      name: "Administrador",
      email: "admin@erp.local",
      passwordHash,
      role: UserRole.OWNER
    }
  });

  const [salesCC, purchaseCC, productionCC, warehouse, saleRule, purchaseRule, produtoFinal, materiaPrima] = await Promise.all([
    prisma.costCenter.upsert({
      where: { companyId_code: { companyId: company.id, code: "CC-VEND" } },
      update: { name: "Matriculas e Mensalidades" },
      create: { companyId: company.id, code: "CC-VEND", name: "Matriculas e Mensalidades", dreGroup: "Receita Bruta" }
    }),
    prisma.costCenter.upsert({
      where: { companyId_code: { companyId: company.id, code: "CC-COMP" } },
      update: { name: "Compras" },
      create: { companyId: company.id, code: "CC-COMP", name: "Compras", dreGroup: "Custos Variaveis" }
    }),
    prisma.costCenter.upsert({
      where: { companyId_code: { companyId: company.id, code: "CC-PROD" } },
      update: { name: "Quadras e Operacoes" },
      create: { companyId: company.id, code: "CC-PROD", name: "Quadras e Operacoes", dreGroup: "Custos Operacionais" }
    }),
    prisma.warehouse.upsert({
      where: { companyId_code: { companyId: company.id, code: "DEP-01" } },
      update: { name: "Deposito de Equipamentos Tenis" },
      create: { companyId: company.id, code: "DEP-01", name: "Deposito de Equipamentos Tenis" }
    }),
    prisma.taxRule.upsert({
      where: { companyId_code: { companyId: company.id, code: "VENDA-SP" } },
      update: {},
      create: {
        companyId: company.id,
        code: "VENDA-SP",
        name: "Venda interna SP",
        operationType: "SALE",
        cfopInternal: "5102",
        cstIcms: "00",
        cstPis: "01",
        cstCofins: "01",
        icmsRate: new Prisma.Decimal(18),
        pisRate: new Prisma.Decimal(1.65),
        cofinsRate: new Prisma.Decimal(7.6)
      }
    }),
    prisma.taxRule.upsert({
      where: { companyId_code: { companyId: company.id, code: "COMPRA-SP" } },
      update: {},
      create: {
        companyId: company.id,
        code: "COMPRA-SP",
        name: "Compra interna SP",
        operationType: "PURCHASE",
        cfopInternal: "1102",
        cstIcms: "00",
        cstPis: "50",
        cstCofins: "50",
        icmsRate: new Prisma.Decimal(18),
        pisRate: new Prisma.Decimal(1.65),
        cofinsRate: new Prisma.Decimal(7.6)
      }
    }),
    prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: "PA-001" } },
      update: { name: "Plano Anual Tenis", salePrice: new Prisma.Decimal(1200), costPrice: new Prisma.Decimal(200) },
      create: {
        companyId: company.id,
        sku: "PA-001",
        name: "Plano Anual Tenis",
        type: "FINISHED_GOOD",
        unit: "UN",
        ncm: "84715010",
        salePrice: new Prisma.Decimal(1200),
        costPrice: new Prisma.Decimal(200)
      }
    }),
    prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: "MP-001" } },
      update: { name: "Raquete Head Speed Pro", costPrice: new Prisma.Decimal(850) },
      create: {
        companyId: company.id,
        sku: "MP-001",
        name: "Raquete Head Speed Pro",
        type: "RAW_MATERIAL",
        unit: "UN",
        ncm: "39219019",
        salePrice: new Prisma.Decimal(0),
        costPrice: new Prisma.Decimal(850)
      }
    })
  ]);

  await prisma.employee.upsert({
    where: { personId: employeePerson.id },
    update: {},
    create: {
      companyId: company.id,
      personId: employeePerson.id,
      registration: "0001",
      department: "Ensino",
      roleTitle: "Professor de Tenis",
      hireDate: new Date("2025-01-06T00:00:00.000Z"),
      baseSalary: new Prisma.Decimal(4500),
      timeTrackingMode: "CLOCK_IN_OUT"
    }
  });

  await prisma.billOfMaterial.upsert({
    where: { companyId_code_version: { companyId: company.id, code: "BOM-PA-001", version: "1.0" } },
    update: {},
    create: {
      companyId: company.id,
      code: "BOM-PA-001",
      version: "1.0",
      productId: produtoFinal.id,
      items: {
        create: [{ componentId: materiaPrima.id, quantity: new Prisma.Decimal(1), sequence: 10 }]
      }
    }
  });

  await prisma.digitalCertificate.deleteMany({
    where: { companyId: company.id }
  });

  await prisma.digitalCertificate.create({
    data: {
      companyId: company.id,
      name: "A1 Winner Academia Matriz",
      storageRef: "vault://certificates/winner-academia/a1",
      passwordVaultRef: "vault://certificates/winner-academia/password",
      validUntil: new Date("2027-12-31T00:00:00.000Z"),
      environment: "HOMOLOG"
    }
  });

  await prisma.inventoryBalance.upsert({
    where: {
      warehouseId_productId_batchCode: {
        warehouseId: warehouse.id,
        productId: materiaPrima.id,
        batchCode: ""
      }
    },
    update: { quantity: new Prisma.Decimal(15), averageCost: new Prisma.Decimal(2500) },
    create: {
      companyId: company.id,
      warehouseId: warehouse.id,
      productId: materiaPrima.id,
      quantity: new Prisma.Decimal(500),
      averageCost: new Prisma.Decimal(2500)
    }
  });

  const salesOrder = await prisma.salesOrder.upsert({
    where: { companyId_code: { companyId: company.id, code: "PV-0001" } },
    update: {
      totalGross: new Prisma.Decimal(12000),
      totalNet: new Prisma.Decimal(12000),
      paymentTerms: "30/60/90",
      salesRep: "Recepcao Winner"
    },
    create: {
      companyId: company.id,
      customerId: customer.id,
      costCenterId: salesCC.id,
      taxRuleId: saleRule.id,
      code: "PV-0001",
      status: DocumentStatus.APPROVED,
      totalGross: new Prisma.Decimal(12000),
      totalNet: new Prisma.Decimal(12000),
      paymentTerms: "30/60/90",
      salesRep: "Recepcao Winner",
      commissionRate: new Prisma.Decimal(5),
      items: {
        create: [
          {
            productId: produtoFinal.id,
            quantity: new Prisma.Decimal(10),
            unitPrice: new Prisma.Decimal(1200),
            total: new Prisma.Decimal(12000)
          }
        ]
      }
    }
  });

  await prisma.fiscalInvoice.upsert({
    where: { companyId_number_series_model: { companyId: company.id, number: "1", series: "1", model: InvoiceModel.NFE } },
    update: {},
    create: {
      companyId: company.id,
      taxRuleId: saleRule.id,
      salesOrderId: salesOrder.id,
      model: InvoiceModel.NFE,
      status: DocumentStatus.AUTHORIZED,
      number: "1",
      series: "1",
      operationNature: "Venda de mercadoria",
      totalProducts: new Prisma.Decimal(12000),
      totalInvoice: new Prisma.Decimal(12000),
      totalIcms: new Prisma.Decimal(2160),
      totalPis: new Prisma.Decimal(198),
      totalCofins: new Prisma.Decimal(912)
    }
  });

  await prisma.financialEntry.deleteMany({
    where: {
      companyId: company.id,
      sourceId: { in: [salesOrder.id, "seed-purchase"] }
    }
  });

  await prisma.financialEntry.createMany({
    data: [
      {
        companyId: company.id,
        costCenterId: salesCC.id,
        salesOrderId: salesOrder.id,
        direction: FinancialDirection.RECEIVABLE,
        category: "VENDAS",
        sourceType: "SALES_ORDER",
        sourceId: salesOrder.id,
        description: "Parcela 1/3 - Planos Tenis BeneCorp PV-0001",
        amount: new Prisma.Decimal(4000),
        dueDate: new Date("2026-04-30T00:00:00.000Z"),
        competenceDate: new Date("2026-04-01T00:00:00.000Z")
      },
      {
        companyId: company.id,
        costCenterId: salesCC.id,
        salesOrderId: salesOrder.id,
        direction: FinancialDirection.RECEIVABLE,
        category: "VENDAS",
        sourceType: "SALES_ORDER",
        sourceId: salesOrder.id,
        description: "Parcela 2/3 - Planos Tenis BeneCorp PV-0001",
        amount: new Prisma.Decimal(4000),
        dueDate: new Date("2026-05-30T00:00:00.000Z"),
        competenceDate: new Date("2026-04-01T00:00:00.000Z")
      },
      {
        companyId: company.id,
        costCenterId: purchaseCC.id,
        direction: FinancialDirection.PAYABLE,
        category: "COMPRAS",
        sourceType: "PURCHASE_ORDER",
        sourceId: "seed-purchase",
        description: "Compra raquetes - SportTennis",
        amount: new Prisma.Decimal(8500),
        dueDate: new Date("2026-04-20T00:00:00.000Z"),
        competenceDate: new Date("2026-04-01T00:00:00.000Z")
      }
    ]
  });

  await prisma.task.deleteMany({
    where: { companyId: company.id }
  });

  await prisma.task.createMany({
    data: [
      {
        companyId: company.id,
        title: "Conferir nota fiscal das raquetes - SportTennis",
        module: "Compras",
        slaHours: 8,
        status: "OPEN",
        assignee: "Suprimentos",
        dueAt: new Date("2026-06-06T15:00:00.000Z")
      },
      {
        companyId: company.id,
        title: "Renovar contratos BeneCorp - lote corporativo",
        module: "Comercial",
        slaHours: 24,
        status: "IN_PROGRESS",
        assignee: "Recepcao Winner",
        dueAt: new Date("2026-06-10T18:00:00.000Z")
      },
      {
        companyId: company.id,
        title: "Agendar manutencao das quadras de saibro",
        module: "Operacoes",
        slaHours: 48,
        status: "OPEN",
        assignee: "Quadras e Operacoes",
        dueAt: new Date("2026-06-08T12:00:00.000Z")
      }
    ]
  });

  await prisma.auditLog.deleteMany({
    where: { companyId: company.id }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        entity: "SalesOrder",
        entityId: salesOrder.id,
        action: "SEED_ORDER_APPROVED",
        payload: { code: "PV-0001", totalNet: 12000 } as Prisma.InputJsonValue
      },
      {
        companyId: company.id,
        entity: "CostCenter",
        entityId: productionCC.id,
        action: "SEED_DRE_STRUCTURE",
        payload: { code: "CC-PROD", dreGroup: "Custos Operacionais" } as Prisma.InputJsonValue
      }
    ]
  });

  // ── Alunos individuais (CPF) ───────────────────────────────────────────────
  // CPFs válidos (verificados pelo algoritmo mod-11)
  await Promise.all([
    prisma.person.upsert({
      where: { companyId_document: { companyId: company.id, document: "52998224725" } },
      update: {},
      create: { companyId: company.id, legalName: "Ana Paula Ferreira",  document: "52998224725", city: "Sao Paulo", state: "SP", kinds: [PersonKind.CUSTOMER] }
    }),
    prisma.person.upsert({
      where: { companyId_document: { companyId: company.id, document: "11144477735" } },
      update: {},
      create: { companyId: company.id, legalName: "Bruno Oliveira Lima",  document: "11144477735", city: "Sao Paulo", state: "SP", kinds: [PersonKind.CUSTOMER] }
    }),
    prisma.person.upsert({
      where: { companyId_document: { companyId: company.id, document: "12345678909" } },
      update: {},
      create: { companyId: company.id, legalName: "Camila Rodrigues",     document: "12345678909", city: "Sao Paulo", state: "SP", kinds: [PersonKind.CUSTOMER] }
    })
  ]);

  // ── Contas do portal do cliente ──────────────────────────────────────────
  const DEMO_CLIENT_PASSWORD = "winner123";
  const clientHash = await bcrypt.hash(DEMO_CLIENT_PASSWORD, 10);
  const students = await prisma.person.findMany({
    where: { companyId: company.id, kinds: { has: PersonKind.CUSTOMER } }
  });
  for (const s of students) {
    await prisma.clientAccount.upsert({
      where:  { personId: s.id },
      update: {},
      create: { companyId: company.id, personId: s.id, passwordHash: clientHash, firstAccess: false }
    });
  }

  // ── Turmas ────────────────────────────────────────────────────────────────
  const profName = employeePerson.legalName;
  await Promise.all([
    prisma.classSchedule.upsert({
      where: { companyId_code: { companyId: company.id, code: "T-01" } },
      update: { instructor: profName },
      create: { companyId: company.id, code: "T-01", name: "Iniciante Adulto — Manhã",     level: "Iniciante",    instructor: profName, schedule: "Seg/Qua/Sex 08:00–09:00", surface: "Saibro",     capacity: 8 }
    }),
    prisma.classSchedule.upsert({
      where: { companyId_code: { companyId: company.id, code: "T-02" } },
      update: { instructor: profName },
      create: { companyId: company.id, code: "T-02", name: "Intermediário Adulto — Tarde", level: "Intermediario",instructor: profName, schedule: "Ter/Qui 17:00–18:30",     surface: "Hard Court", capacity: 6 }
    }),
    prisma.classSchedule.upsert({
      where: { companyId_code: { companyId: company.id, code: "T-03" } },
      update: { instructor: profName },
      create: { companyId: company.id, code: "T-03", name: "Infantil 6–10 anos",           level: "Iniciante",    instructor: profName, schedule: "Sáb 09:00–10:00",         surface: "Saibro",     capacity: 10 }
    }),
    prisma.classSchedule.upsert({
      where: { companyId_code: { companyId: company.id, code: "T-04" } },
      update: { instructor: profName },
      create: { companyId: company.id, code: "T-04", name: "Avançado — Competição",        level: "Avancado",     instructor: profName, schedule: "Seg/Qua/Sex 06:30–08:00", surface: "Saibro",     capacity: 4 }
    })
  ]);

  console.log({
    company: company.tradeName,
    supplier: supplier.legalName,
    adminEmail: "admin@erp.local",
    adminPassword: DEMO_PASSWORD
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
