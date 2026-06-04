// Dados demo embutidos — usados quando a API está offline (ex: Vercel sem backend)

const hoje = new Date();
const d = (days: number) => {
  const dt = new Date(hoje);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
};
const fmt = (v: number) => v.toFixed(2);

export const DEMO = {
  company: { id: "demo", tradeName: "Winner Academia", cnpj: "12345678000199" },

  products: [
    { id: "p1", sku: "MENS-001", name: "Mensalidade Tênis",       type: "SERVICE",       unit: "MÊS", salePrice: "350.00",  costPrice: "0.00" },
    { id: "p2", sku: "MAT-001",  name: "Taxa de Matrícula",       type: "SERVICE",       unit: "UN",  salePrice: "200.00",  costPrice: "0.00" },
    { id: "p3", sku: "AVUL-001", name: "Aula Avulsa",             type: "SERVICE",       unit: "UN",  salePrice: "80.00",   costPrice: "0.00" },
    { id: "p4", sku: "EQ-001",   name: "Raquete Head Speed Pro",  type: "FINISHED_GOOD", unit: "UN",  salePrice: "1200.00", costPrice: "750.00" },
    { id: "p5", sku: "EQ-002",   name: "Bola Wilson x3",         type: "FINISHED_GOOD", unit: "CX",  salePrice: "45.00",   costPrice: "28.00" },
    { id: "p6", sku: "EQ-003",   name: "Grip Overgrip",           type: "FINISHED_GOOD", unit: "UN",  salePrice: "15.00",   costPrice: "8.00" },
  ],

  suppliers: [
    { id: "s1", legalName: "Sport Tennis Equipamentos LTDA", tradeName: "SportTennis",    document: "11122233000144", city: "Campinas",  state: "SP", kinds: ["SUPPLIER"] },
    { id: "s2", legalName: "Distribuidora Bebidas SP LTDA",  tradeName: "BebeSP",          document: "22233344000155", city: "São Paulo", state: "SP", kinds: ["SUPPLIER"] },
    { id: "s3", legalName: "TotalManutenção Serviços LTDA",  tradeName: "TotalManutenção", document: "33344455000166", city: "São Paulo", state: "SP", kinds: ["SUPPLIER"] },
  ],

  customers: [
    { id: "c1", legalName: "Benefícios Corporativos SA", tradeName: "BeneCorp", document: "98765432000110", city: "São Paulo", state: "SP", kinds: ["CUSTOMER"] },
    { id: "c2", legalName: "Itaú Unibanco SA",           tradeName: "Itaú",     document: "60872504000123", city: "São Paulo", state: "SP", kinds: ["CUSTOMER"] },
    { id: "c3", legalName: "Siemens Brasil LTDA",        tradeName: "Siemens",  document: "51477987000177", city: "São Paulo", state: "SP", kinds: ["CUSTOMER"] },
  ],

  alunos: [
    { id: "a01", legalName: "Ana Paula Ferreira",   name: "Ana Paula Ferreira",   document: "52998224725", phone: "(11) 98765-4321", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a02", legalName: "Bruno Oliveira Lima",  name: "Bruno Oliveira Lima",  document: "11144477735", phone: "(11) 91234-5678", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a03", legalName: "Camila Rodrigues",     name: "Camila Rodrigues",     document: "12345678909", phone: "(11) 97654-3210", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a04", legalName: "Diego Mendes Costa",   name: "Diego Mendes Costa",   document: "98765432100", phone: "(11) 95555-1234", city: "Santo André", state: "SP", hasPortalAccess: false },
    { id: "a05", legalName: "Elena Souza Martins",  name: "Elena Souza Martins",  document: "71428793860", phone: "(11) 94444-5678", city: "S. Bernardo", state: "SP", hasPortalAccess: true  },
    { id: "a06", legalName: "Felipe Carvalho",      name: "Felipe Carvalho",      document: "87748248800", phone: "(11) 93333-9012", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a07", legalName: "Gabriela Nascimento",  name: "Gabriela Nascimento",  document: "45678912345", phone: "(11) 92222-3456", city: "Guarulhos",   state: "SP", hasPortalAccess: false },
    { id: "a08", legalName: "Henrique Alves",       name: "Henrique Alves",       document: "32165498732", phone: "(11) 91111-7890", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a09", legalName: "Isabela Torres",       name: "Isabela Torres",       document: "15975348612", phone: "(11) 99999-2345", city: "Osasco",      state: "SP", hasPortalAccess: false },
    { id: "a10", legalName: "João Pedro Andrade",   name: "João Pedro Andrade",   document: "96385274196", phone: "(11) 98888-6789", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a11", legalName: "Karen Lima Santos",    name: "Karen Lima Santos",    document: "25836914725", phone: "(11) 97777-0123", city: "São Paulo",   state: "SP", hasPortalAccess: true  },
    { id: "a12", legalName: "Lucas Pereira Gomes",  name: "Lucas Pereira Gomes",  document: "36914725836", phone: "(11) 96666-4567", city: "Diadema",     state: "SP", hasPortalAccess: false },
  ],

  warehouses:  [
    { id: "w1", code: "DEP-01", name: "Depósito de Equipamentos" },
    { id: "w2", code: "DEP-02", name: "Loja e Vestiário" },
  ],

  costCenters: [
    { id: "cc1", code: "CC-VEND", name: "Matrículas e Mensalidades", dreGroup: "Receita Bruta" },
    { id: "cc2", code: "CC-COMP", name: "Compras e Suprimentos",     dreGroup: "Custos Variáveis" },
    { id: "cc3", code: "CC-OPER", name: "Quadras e Operações",       dreGroup: "Custos Operacionais" },
    { id: "cc4", code: "CC-RH",   name: "Recursos Humanos",           dreGroup: "Despesas com Pessoal" },
    { id: "cc5", code: "CC-MKT",  name: "Marketing",                  dreGroup: "Despesas Comerciais" },
  ],

  taxRules: [
    { id: "tr1", code: "VENDA-SP",  name: "Venda interna SP",  operationType: "SALE",     cfopInternal: "5102", cstIcms: "00", icmsRate: "18.0000", pisRate: "1.6500", cofinsRate: "7.6000" },
    { id: "tr2", code: "COMPRA-SP", name: "Compra interna SP", operationType: "PURCHASE", cfopInternal: "1102", cstIcms: "00", icmsRate: "18.0000", pisRate: "1.6500", cofinsRate: "7.6000" },
  ],

  certificates: [
    { id: "cert1", name: "A1 Winner Academia", environment: "HOMOLOG", validUntil: "2027-12-31" }
  ],

  // Pedidos de venda
  orders: [
    { id: "pv1", code: "PV-0001", status: "APPROVED", issueDate: d(-20), totalNet: "10500.00", customer: { legalName: "Benefícios Corporativos SA" }, items: [{ product: { name: "Mensalidade Tênis" }, quantity: "30", unitPrice: "350.00", total: "10500.00" }], paymentTerms: "30/60/90" },
    { id: "pv2", code: "PV-0002", status: "APPROVED", issueDate: d(-15), totalNet:  "7000.00", customer: { legalName: "Itaú Unibanco SA" },           items: [{ product: { name: "Mensalidade Tênis" }, quantity: "20", unitPrice: "350.00", total:  "7000.00" }], paymentTerms: "À vista" },
    { id: "pv3", code: "PV-0003", status: "APPROVED", issueDate: d(-10), totalNet:  "5250.00", customer: { legalName: "Siemens Brasil LTDA" },         items: [{ product: { name: "Mensalidade Tênis" }, quantity: "15", unitPrice: "350.00", total:  "5250.00" }], paymentTerms: "30 dias" },
    { id: "pv4", code: "PV-0004", status: "APPROVED", issueDate: d(-5),  totalNet:   "350.00", customer: { legalName: "Ana Paula Ferreira" },          items: [{ product: { name: "Mensalidade Tênis" }, quantity: "1",  unitPrice: "350.00", total:   "350.00" }], paymentTerms: "À vista" },
  ],

  // Pedidos de compra
  purchaseOrders: [
    { id: "po1", code: "PO-0001", status: "APPROVED", issueDate: d(-18), totalNet: "16680.00", supplier: { legalName: "Sport Tennis Equipamentos LTDA" }, items: [{ product: { name: "Raquete Head Speed Pro" }, quantity: "20", unitPrice: "750.00", total: "15000.00" }, { product: { name: "Bola Wilson x3" }, quantity: "60", unitPrice: "28.00", total: "1680.00" }] },
    { id: "po2", code: "PO-0002", status: "APPROVED", issueDate: d(-7),  totalNet:  "4800.00", supplier: { legalName: "TotalManutenção Serviços LTDA" },   items: [{ product: { name: "Grip Overgrip" },         quantity: "120", unitPrice: "8.00", total: "960.00" }, { product: { name: "Bola Wilson x3" }, quantity: "100", unitPrice: "28.00", total: "2800.00" }] },
  ],

  // Notas fiscais
  invoices: [
    { id: "nf1", number: "001", series: "1", model: "NFE", status: "AUTHORIZED", operationNature: "Venda de serviços de academia",   totalInvoice: "10500.00", totalIcms: "1890.00", totalPis: "173.25", totalCofins: "798.00" },
    { id: "nf2", number: "002", series: "1", model: "NFE", status: "AUTHORIZED", operationNature: "Venda de serviços de academia",   totalInvoice:  "7000.00", totalIcms: "1260.00", totalPis: "115.50", totalCofins: "532.00" },
    { id: "nf3", number: "003", series: "1", model: "NFE", status: "AUTHORIZED", operationNature: "Compra de equipamentos esportivos", totalInvoice: "16680.00", totalIcms: "3002.40", totalPis: "275.22", totalCofins: "1267.68" },
  ],

  // Estoque
  balances: [
    { id: "b1", product: { sku: "EQ-001", name: "Raquete Head Speed Pro", unit: "UN" }, warehouse: { name: "Depósito de Equipamentos" }, quantity: "18.000", averageCost: "750.0000" },
    { id: "b2", product: { sku: "EQ-002", name: "Bola Wilson x3",         unit: "CX" }, warehouse: { name: "Depósito de Equipamentos" }, quantity: "60.000", averageCost:  "28.0000" },
    { id: "b3", product: { sku: "EQ-003", name: "Grip Overgrip",           unit: "UN" }, warehouse: { name: "Loja e Vestiário" },         quantity: "120.000", averageCost:  "8.0000" },
  ],

  movements: [
    { id: "m1", occurredAt: d(-18) + "T10:00:00Z", type: "INBOUND",  product: { name: "Raquete Head Speed Pro" }, warehouse: { name: "Depósito de Equipamentos" }, quantity: "20.000", unitCost: "750.0000", referenceType: "PURCHASE_ORDER", referenceId: "PO-0001" },
    { id: "m2", occurredAt: d(-18) + "T10:05:00Z", type: "INBOUND",  product: { name: "Bola Wilson x3" },         warehouse: { name: "Depósito de Equipamentos" }, quantity: "60.000", unitCost:  "28.0000", referenceType: "PURCHASE_ORDER", referenceId: "PO-0001" },
    { id: "m3", occurredAt: d(-5)  + "T14:30:00Z", type: "OUTBOUND", product: { name: "Raquete Head Speed Pro" }, warehouse: { name: "Depósito de Equipamentos" }, quantity:  "2.000", unitCost: "750.0000", referenceType: "SALES_ORDER",    referenceId: "PV-0002" },
    { id: "m4", occurredAt: d(-7)  + "T09:00:00Z", type: "INBOUND",  product: { name: "Grip Overgrip" },          warehouse: { name: "Loja e Vestiário" },         quantity: "120.000", unitCost:  "8.0000", referenceType: "PURCHASE_ORDER", referenceId: "PO-0002" },
  ],

  // Financeiro
  summary: { totalReceivable: 30800, totalPayable: 45480, overdueReceivable: 3850, overduePayable: 2340, netBalance: -14680 },

  entries: [
    // RECEBÍVEIS
    { id: "e01", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidades BeneCorp — Parcela 1/3 (PV-0001)", amount: fmt(3500),  dueDate: d(-15), status: "OVERDUE",  settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e02", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidades BeneCorp — Parcela 2/3 (PV-0001)", amount: fmt(3500),  dueDate: d(15),  status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e03", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidades BeneCorp — Parcela 3/3 (PV-0001)", amount: fmt(3500),  dueDate: d(45),  status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e04", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidades Itaú Unibanco (PV-0002)",           amount: fmt(7000),  dueDate: d(-5),  status: "SETTLED",  settledAmount: fmt(7000),costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e05", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidades Siemens Brasil (PV-0003)",          amount: fmt(5250),  dueDate: d(20),  status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e06", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidade Jun/2026 — Ana Paula Ferreira",     amount: fmt(350),   dueDate: d(5),   status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e07", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidade Jun/2026 — Bruno Oliveira Lima",    amount: fmt(350),   dueDate: d(5),   status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e08", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidade Jun/2026 — Camila Rodrigues",       amount: fmt(350),   dueDate: d(-8),  status: "OVERDUE",  settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e09", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidade Jun/2026 — Diego Mendes Costa",     amount: fmt(350),   dueDate: d(5),   status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e10", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidade Mai/2026 — Elena Souza Martins",    amount: fmt(350),   dueDate: d(-20), status: "SETTLED",  settledAmount: fmt(350), costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e11", direction: "RECEIVABLE", category: "MENSALIDADE", description: "Mensalidade Jun/2026 — Felipe Carvalho",        amount: fmt(350),   dueDate: d(5),   status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    { id: "e12", direction: "RECEIVABLE", category: "MATRICULA",   description: "Matrícula — Gabriela Nascimento",               amount: fmt(200),   dueDate: d(3),   status: "OPEN",     settledAmount: "0.00",   costCenter: { name: "Matrículas e Mensalidades" } },
    // PAGÁVEIS
    { id: "e13", direction: "PAYABLE", category: "COMPRAS",   description: "Equipamentos esportivos — SportTennis (PO-0001)", amount: fmt(16680), dueDate: d(10),  status: "OPEN",    settledAmount: "0.00",    costCenter: { name: "Compras e Suprimentos" } },
    { id: "e14", direction: "PAYABLE", category: "COMPRAS",   description: "Material de quadras — TotalManutenção (PO-0002)", amount: fmt(4800),  dueDate: d(20),  status: "OPEN",    settledAmount: "0.00",    costCenter: { name: "Compras e Suprimentos" } },
    { id: "e15", direction: "PAYABLE", category: "FOLHA",     description: "Folha de pagamento — Junho 2026",                  amount: fmt(12500), dueDate: d(25),  status: "OPEN",    settledAmount: "0.00",    costCenter: { name: "Recursos Humanos" } },
    { id: "e16", direction: "PAYABLE", category: "ALUGUEL",   description: "Aluguel das quadras — Junho 2026",                 amount: fmt(8000),  dueDate: d(28),  status: "OPEN",    settledAmount: "0.00",    costCenter: { name: "Quadras e Operações" } },
    { id: "e17", direction: "PAYABLE", category: "ENERGIA",   description: "Conta de energia elétrica — Maio 2026",            amount: fmt(2340),  dueDate: d(-3),  status: "SETTLED", settledAmount: fmt(2340), costCenter: { name: "Quadras e Operações" } },
    { id: "e18", direction: "PAYABLE", category: "MARKETING", description: "Marketing digital — Instagram/Google Ads",         amount: fmt(1500),  dueDate: d(8),   status: "OPEN",    settledAmount: "0.00",    costCenter: { name: "Marketing" } },
  ],

  agingReceivable: [
    { label: "A vencer 1–15 dias",  count: 6, amount: 350 * 5 + 200 },
    { label: "A vencer 16–30 dias", count: 2, amount: 5250 + 3500 },
    { label: "A vencer 31–60 dias", count: 1, amount: 3500 },
    { label: "Vencidos",            count: 2, amount: 3500 + 350 },
  ],

  agingPayable: [
    { label: "A vencer 1–15 dias",  count: 2, amount: 16680 + 1500 },
    { label: "A vencer 16–30 dias", count: 3, amount: 4800 + 12500 + 8000 },
    { label: "Vencidos",            count: 0, amount: 0 },
  ],

  // BI
  kpis: { revenue: 22750, expense: 45480, inventoryValue: 18840, operatingResult: -22730 },

  dre: [
    { label: "Receita Bruta",            amount: fmt(22750) },
    { label: "(-) Deduções e Impostos",  amount: fmt(-3822) },
    { label: "Receita Líquida",          amount: fmt(18928) },
    { label: "(-) Custos Variáveis",     amount: fmt(-21480) },
    { label: "Lucro Bruto",              amount: fmt(-2552) },
    { label: "(-) Despesas Operacionais",amount: fmt(-22000) },
    { label: "Resultado Operacional",    amount: fmt(-24552) },
  ],

  topInventory: [
    { sku: "EQ-001", product: "Raquete Head Speed Pro", value: fmt(18 * 750) },
    { sku: "EQ-002", product: "Bola Wilson x3",         value: fmt(60 * 28)  },
    { sku: "EQ-003", product: "Grip Overgrip",          value: fmt(120 * 8)  },
  ],

  // BOM / Produção
  boms: [
    { id: "bom1", code: "BOM-EQ001", version: "1.0", product: { name: "Raquete Head Speed Pro" }, items: [{ component: { name: "Raquete Head Speed Pro" }, quantity: "1.000" }] }
  ],

  productionOrders: [],

  // Governança
  tasks: [
    { id: "t1", title: "Conferir NF da SportTennis — PO-0001",            module: "Compras",     slaHours: 8,  status: "OPEN",        assignee: "Marina Costa",      dueAt: d(2) },
    { id: "t2", title: "Renovar contrato BeneCorp — lote corporativo",    module: "Comercial",   slaHours: 24, status: "IN_PROGRESS", assignee: "Paula Mendes",      dueAt: d(5) },
    { id: "t3", title: "Agendar manutenção das quadras de saibro",        module: "Operações",   slaHours: 48, status: "OPEN",        assignee: "Ricardo Monteiro",  dueAt: d(4) },
    { id: "t4", title: "Enviar cobranças em atraso — BeneCorp Parcela 1", module: "Financeiro",  slaHours: 4,  status: "OPEN",        assignee: "Marina Costa",      dueAt: d(1) },
    { id: "t5", title: "Cadastrar novos alunos — lista Siemens",          module: "Comercial",   slaHours: 8,  status: "IN_PROGRESS", assignee: "Paula Mendes",      dueAt: d(3) },
    { id: "t6", title: "Fechar folha de pagamento — Junho",               module: "RH",          slaHours: 8,  status: "OPEN",        assignee: "Rodrigo Ferale",    dueAt: d(7) },
  ],

  auditLogs: [
    { id: "al1", entity: "SalesOrder",    entityId: "pv1", action: "CREATED",      createdAt: d(-20) + "T09:00:00Z", payload: { code: "PV-0001", customer: "BeneCorp", total: 10500 } },
    { id: "al2", entity: "SalesOrder",    entityId: "pv2", action: "APPROVED",     createdAt: d(-15) + "T10:30:00Z", payload: { code: "PV-0002", customer: "Itaú", total: 7000 } },
    { id: "al3", entity: "PurchaseOrder", entityId: "po1", action: "APPROVED",     createdAt: d(-18) + "T11:00:00Z", payload: { code: "PO-0001", supplier: "SportTennis", total: 16680 } },
    { id: "al4", entity: "FinancialEntry",entityId: "e04", action: "SETTLED",      createdAt: d(-5)  + "T14:00:00Z", payload: { description: "Itaú Unibanco quitado", amount: 7000 } },
    { id: "al5", entity: "Person",        entityId: "a07", action: "CREATED",      createdAt: d(-3)  + "T08:00:00Z", payload: { name: "Gabriela Nascimento", type: "CUSTOMER" } },
    { id: "al6", entity: "FinancialEntry",entityId: "e17", action: "SETTLED",      createdAt: d(-3)  + "T15:00:00Z", payload: { description: "Energia elétrica Mai/2026 quitada", amount: 2340 } },
  ],

  // Turmas
  turmas: [
    { id: "cl1", code: "T-01", name: "Iniciante Adulto — Manhã",     level: "Iniciante",     instructor: "Carlos Eduardo Santos",  schedule: "Seg/Qua/Sex 08:00–09:00", surface: "Saibro",     capacity: 8,  _count: { bookings: 5 } },
    { id: "cl2", code: "T-02", name: "Intermediário Adulto — Tarde", level: "Intermediário", instructor: "Luisa Fernanda Ramos",   schedule: "Ter/Qui 17:00–18:30",     surface: "Hard Court", capacity: 6,  _count: { bookings: 5 } },
    { id: "cl3", code: "T-03", name: "Infantil 6–10 anos",           level: "Iniciante",     instructor: "Luisa Fernanda Ramos",   schedule: "Sáb 09:00–10:00",         surface: "Saibro",     capacity: 10, _count: { bookings: 6 } },
    { id: "cl4", code: "T-04", name: "Avançado — Competição",        level: "Avançado",      instructor: "Carlos Eduardo Santos",  schedule: "Seg/Qua/Sex 06:30–08:00", surface: "Saibro",     capacity: 4,  _count: { bookings: 3 } },
    { id: "cl5", code: "T-05", name: "Funcional + Tênis",            level: "Intermediário", instructor: "Ricardo Monteiro",       schedule: "Ter/Qui 19:00–20:30",     surface: "Hard Court", capacity: 8,  _count: { bookings: 5 } },
  ],

  agendamentos: [
    { id: "b1", personName: "Ana Paula Ferreira",  personDocument: "52998224725", classSchedule: { name: "Iniciante Adulto — Manhã" },     date: d(0),  status: "CONFIRMED" },
    { id: "b2", personName: "Bruno Oliveira Lima", personDocument: "11144477735", classSchedule: { name: "Intermediário Adulto — Tarde" }, date: d(0),  status: "CONFIRMED" },
    { id: "b3", personName: "Camila Rodrigues",    personDocument: "12345678909", classSchedule: { name: "Infantil 6–10 anos" },           date: d(0),  status: "CONFIRMED" },
    { id: "b4", personName: "Diego Mendes Costa",  personDocument: "98765432100", classSchedule: { name: "Avançado — Competição" },        date: d(1),  status: "CONFIRMED" },
    { id: "b5", personName: "Elena Souza Martins", personDocument: "71428793860", classSchedule: { name: "Funcional + Tênis" },            date: d(1),  status: "CONFIRMED" },
    { id: "b6", personName: "Felipe Carvalho",     personDocument: "87748248800", classSchedule: { name: "Iniciante Adulto — Manhã" },     date: d(-1), status: "ATTENDED" },
  ],

  totalVagas: 36,
  totalMatriculados: 24,
  shareUrl: "https://winner-app-ten.vercel.app/agendar",

  // Quadras
  quadras: [
    { id: "q1", name: "Quadra 1 — Saibro",     surface: "Saibro",     status: "Disponivel",  currentUse: null,                        nextBooking: "T-01 — 08:00" },
    { id: "q2", name: "Quadra 2 — Saibro",     surface: "Saibro",     status: "Ocupada",     currentUse: "Turma Avançado 06:30",      nextBooking: "T-01 — 08:00" },
    { id: "q3", name: "Quadra 3 — Hard Court", surface: "Hard Court", status: "Disponivel",  currentUse: null,                        nextBooking: "T-02 — 17:00" },
    { id: "q4", name: "Quadra 4 — Hard Court", surface: "Hard Court", status: "Manutencao",  currentUse: "Troca de piso",             nextBooking: null },
  ],

  agendaHoje: [
    { horario: "06:30", quadra: "Quadra 2 — Saibro",     aula: "Avançado — Competição",        instrutor: "Carlos Eduardo Santos",  vagas: "3/4" },
    { horario: "08:00", quadra: "Quadra 1 — Saibro",     aula: "Iniciante Adulto — Manhã",     instrutor: "Carlos Eduardo Santos",  vagas: "5/8" },
    { horario: "09:00", quadra: "Quadra 1 — Saibro",     aula: "Infantil 6–10 anos",           instrutor: "Luisa Fernanda Ramos",   vagas: "6/10" },
    { horario: "17:00", quadra: "Quadra 3 — Hard Court", aula: "Intermediário Adulto — Tarde", instrutor: "Luisa Fernanda Ramos",   vagas: "5/6" },
    { horario: "19:00", quadra: "Quadra 3 — Hard Court", aula: "Funcional + Tênis",            instrutor: "Ricardo Monteiro",       vagas: "5/8" },
  ],

  // Torneios
  torneios: [
    { id: "to1", codigo: "TORN-01", nome: "Copa Winner Iniciantes",   categoria: "Iniciante",     superficie: "Saibro",     dataInicio: d(30),  dataFim: d(32),  formato: "Chaves simples",     inscricoes: 12, maxInscricoes: 16, premiacao: "Troféu + Kit", status: "Inscricoes abertas" },
    { id: "to2", codigo: "TORN-02", nome: "Torneio Interno Mensal",   categoria: "Intermediário", superficie: "Hard Court", dataInicio: d(14),  dataFim: d(15),  formato: "Round Robin",        inscricoes: 8,  maxInscricoes: 8,  premiacao: "Troféu",       status: "Inscricoes abertas" },
    { id: "to3", codigo: "TORN-03", nome: "Challenger Winner 2026",   categoria: "Avançado",      superficie: "Saibro",     dataInicio: d(-5),  dataFim: d(-3),  formato: "Chaves duplas",      inscricoes: 16, maxInscricoes: 16, premiacao: "R$ 2.000",    status: "Em andamento" },
    { id: "to4", codigo: "TORN-04", nome: "Copa Infantil Primavera",  categoria: "Infantil",      superficie: "Saibro",     dataInicio: d(-30), dataFim: d(-28), formato: "Todos contra todos", inscricoes: 10, maxInscricoes: 12, premiacao: "Medalha",      status: "Encerrado" },
  ],

  // Pessoas (para /cadastros)
  people: [] as any[],
};

// Combina todos para a lista de pessoas
DEMO.people = [...DEMO.customers, ...DEMO.suppliers, ...DEMO.alunos.map(a => ({ ...a, kinds: ["CUSTOMER"] }))];
