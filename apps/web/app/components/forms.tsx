import {
  createBom,
  createCostCenter,
  createCustomer,
  createProduct,
  createProductionOrder,
  createPurchaseOrder,
  createSalesOrder,
  createSupplier,
  createTask,
  createTaxRule,
  createWarehouse
} from "../actions";
import { ActionBar } from "./action-bar";
import { FormSection } from "./form-section";
import { SubmitButton } from "./submit-button";
import { SummaryPanel } from "./summary-panel";

type Option = {
  id: string;
  name?: string;
  legalName?: string;
  code?: string;
  sku?: string;
  type?: string;
  salePrice?: string | number;
  costPrice?: string | number;
};

function SelectField({
  name,
  label,
  options,
  valueKey = "id",
  labelBuilder
}: {
  name: string;
  label: string;
  options: Option[];
  valueKey?: keyof Option;
  labelBuilder: (option: Option) => string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} required>
        {options.map((option) => (
          <option key={String(option[valueKey])} value={String(option[valueKey])}>
            {labelBuilder(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  name,
  label,
  placeholder,
  defaultValue,
  type = "text",
  min,
  step,
  required = true
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string | number;
  type?: string;
  min?: string | number;
  step?: string | number;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        step={step}
        required={required}
      />
    </label>
  );
}

export function SalesOrderForm({ companyId, customers, costCenters, taxRules, warehouses, products }: any) {
  const saleProducts = products.filter((item: any) => Number(item.salePrice) > 0);
  const defaultProduct = saleProducts[0];

  return (
    <form action={createSalesOrder} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Cabecalho do pedido" description="Defina cliente, centro, fiscal e condicao de pagamento." columns={2}>
          <SelectField name="customerId" label="Cliente" options={customers} labelBuilder={(option) => option.legalName ?? ""} />
          <SelectField name="costCenterId" label="Centro de custo" options={costCenters} labelBuilder={(option) => `${option.code} - ${option.name}`} />
          <SelectField name="taxRuleId" label="Regra fiscal" options={taxRules.filter((item: any) => item.operationType === "SALE")} labelBuilder={(option) => `${option.code} - ${option.name}`} />
          <SelectField name="warehouseId" label="Deposito expedidor" options={warehouses} labelBuilder={(option) => option.name ?? ""} />
          <InputField name="paymentTerms" label="Condicao de pagamento" placeholder="Ex.: 30/60" defaultValue="30/60" />
        </FormSection>

        <FormSection title="Item comercial" description="O faturamento gera estoque, fiscal e financeiro no mesmo fluxo." columns={3}>
          <SelectField name="productId" label="Produto" options={saleProducts} labelBuilder={(option) => `${option.sku} - ${option.name}`} />
          <InputField name="quantity" label="Quantidade" type="number" min="1" step="1" defaultValue="1" />
          <InputField name="unitPrice" label="Preco unitario" type="number" min="0.01" step="0.01" defaultValue={defaultProduct?.salePrice ?? "150"} />
          <InputField name="discount" label="Desconto" type="number" min="0" step="0.01" defaultValue="0" />
        </FormSection>

        <ActionBar
          secondary={<span className="helper-text">Ao salvar: baixa estoque, gera NF-e autorizada, auditoria e contas a receber.</span>}
          primary={<SubmitButton label="Faturar pedido" loadingLabel="Faturando pedido..." />}
        />
      </div>

      <SummaryPanel
        title="Resumo do pedido"
        rows={[
          { label: "Produto padrao", value: defaultProduct ? `${defaultProduct.sku}` : "-" },
          { label: "Preco base", value: defaultProduct ? `R$ ${defaultProduct.salePrice}` : "-" },
          { label: "Financeiro", value: "Parcelas por condicao" },
          { label: "Fiscal", value: "NF-e com rastreabilidade" }
        ]}
      />
    </form>
  );
}

export function PurchaseOrderForm({ companyId, suppliers, costCenters, taxRules, warehouses, products }: any) {
  return (
    <form action={createPurchaseOrder} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Cabecalho da entrada" description="Recebimento fiscal e logistica de entrada no mesmo lancamento." columns={2}>
          <SelectField name="supplierId" label="Fornecedor" options={suppliers} labelBuilder={(option) => option.legalName ?? ""} />
          <SelectField name="costCenterId" label="Centro de custo" options={costCenters} labelBuilder={(option) => `${option.code} - ${option.name}`} />
          <SelectField name="taxRuleId" label="Regra fiscal" options={taxRules.filter((item: any) => item.operationType === "PURCHASE")} labelBuilder={(option) => `${option.code} - ${option.name}`} />
          <SelectField name="warehouseId" label="Deposito de entrada" options={warehouses} labelBuilder={(option) => option.name ?? ""} />
          <InputField name="documentNumber" label="Numero da NF de entrada" placeholder="Ex.: 3526010001" defaultValue={`NF-${Date.now().toString().slice(-6)}`} />
          <InputField name="xmlAccessKey" label="Chave/XML (opcional)" placeholder="44 digitos ou identificador" required={false} />
        </FormSection>

        <FormSection title="Item recebido" description="Atualiza saldo, custo medio, fiscal e contas a pagar." columns={3}>
          <SelectField name="productId" label="Produto" options={products} labelBuilder={(option) => `${option.sku} - ${option.name}`} />
          <InputField name="quantity" label="Quantidade" type="number" min="1" step="1" defaultValue="10" />
          <InputField name="unitPrice" label="Custo unitario" type="number" min="0.01" step="0.01" defaultValue={products[0]?.costPrice ?? "20"} />
        </FormSection>

        <ActionBar
          secondary={<span className="helper-text">Ao confirmar: registra compra, documento fiscal, titulo a pagar e entrada em estoque.</span>}
          primary={<SubmitButton label="Receber compra" loadingLabel="Registrando compra..." />}
        />
      </div>

      <SummaryPanel
        title="Resumo do recebimento"
        rows={[
          { label: "Documento fiscal", value: "NF-e de entrada" },
          { label: "Estoque", value: "Entrada e custo medio" },
          { label: "Financeiro", value: "Titulo a pagar" },
          { label: "Auditoria", value: "Evento completo" }
        ]}
      />
    </form>
  );
}

export function ProductionOrderForm({ companyId, warehouses, products }: any) {
  const finishedProducts = products.filter((item: any) => item.type === "FINISHED_GOOD");

  return (
    <form action={createProductionOrder} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Dados da ordem" description="Consome a BOM vigente e devolve o produto acabado ao deposito." columns={2}>
          <SelectField name="productId" label="Produto acabado" options={finishedProducts} labelBuilder={(option) => `${option.sku} - ${option.name}`} />
          <SelectField name="warehouseId" label="Deposito" options={warehouses} labelBuilder={(option) => option.name ?? ""} />
          <InputField name="quantity" label="Quantidade a produzir" type="number" min="1" step="1" defaultValue="5" />
        </FormSection>

        <ActionBar
          secondary={<span className="helper-text">Ao encerrar: o ERP consome insumos da BOM, gera acabado e registra auditoria.</span>}
          primary={<SubmitButton label="Encerrar OP" loadingLabel="Encerrando OP..." />}
        />
      </div>

      <SummaryPanel
        title="Apontamento tecnico"
        rows={[
          { label: "BOM", value: "Versao vigente" },
          { label: "Movimento", value: "Consumo + acabado" },
          { label: "Status final", value: "FINISHED" }
        ]}
      />
    </form>
  );
}

export function ProductForm({ companyId, taxRules }: any) {
  return (
    <form action={createProduct} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Novo produto" description="Cadastro mestre com SKU, tipo, preco, custo e perfil fiscal." columns={2}>
          <InputField name="sku" label="SKU" placeholder="Ex.: PA-010" />
          <InputField name="name" label="Descricao" placeholder="Nome comercial do item" />
          <label className="field">
            <span>Tipo</span>
            <select name="type" defaultValue="FINISHED_GOOD">
              {["FINISHED_GOOD", "RAW_MATERIAL", "PACKAGING", "SERVICE"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <InputField name="unit" label="Unidade" placeholder="UN, KG, CX" defaultValue="UN" />
          <InputField name="salePrice" label="Preco de venda" type="number" min="0" step="0.01" defaultValue="0" />
          <InputField name="costPrice" label="Custo padrao" type="number" min="0" step="0.01" defaultValue="0" />
          <InputField name="minStock" label="Estoque minimo" type="number" min="0" step="0.001" defaultValue="0" />
          <SelectField name="fiscalProfileId" label="Perfil fiscal" options={taxRules} labelBuilder={(option) => `${option.code} - ${option.name}`} />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar produto" loadingLabel="Salvando produto..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Compras, vendas, estoque e producao" }]} />
    </form>
  );
}

export function CustomerForm({ companyId }: { companyId: string }) {
  return (
    <form action={createCustomer} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Novo cliente" description="Cadastro comercial reutilizado em pedidos e financeiro." columns={2}>
          <InputField name="legalName" label="Razao social" placeholder="Cliente Exemplo SA" />
          <InputField name="tradeName" label="Nome fantasia" placeholder="Nome comercial" required={false} />
          <InputField name="document" label="CNPJ/CPF" placeholder="Documento fiscal" />
          <InputField name="email" label="Email" type="email" placeholder="financeiro@cliente.com" required={false} />
          <InputField name="phone" label="Telefone" placeholder="(11) 99999-9999" required={false} />
          <InputField name="city" label="Cidade" placeholder="Sao Paulo" required={false} />
          <InputField name="state" label="UF" placeholder="SP" required={false} />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar cliente" loadingLabel="Salvando cliente..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Comercial, fiscal e financeiro" }]} />
    </form>
  );
}

export function SupplierForm({ companyId }: { companyId: string }) {
  return (
    <form action={createSupplier} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Novo fornecedor" description="Cadastro de suprimentos para compras, fiscal e contas a pagar." columns={2}>
          <InputField name="legalName" label="Razao social" placeholder="Fornecedor LTDA" />
          <InputField name="tradeName" label="Nome fantasia" placeholder="Nome comercial" required={false} />
          <InputField name="document" label="CNPJ/CPF" placeholder="Documento fiscal" />
          <InputField name="email" label="Email" type="email" placeholder="contato@fornecedor.com" required={false} />
          <InputField name="phone" label="Telefone" placeholder="(19) 99999-9999" required={false} />
          <InputField name="city" label="Cidade" placeholder="Campinas" required={false} />
          <InputField name="state" label="UF" placeholder="SP" required={false} />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar fornecedor" loadingLabel="Salvando fornecedor..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Compras, fiscal e contas a pagar" }]} />
    </form>
  );
}

export function WarehouseForm({ companyId }: { companyId: string }) {
  return (
    <form action={createWarehouse} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Novo deposito" description="Estrutura de armazenagem usada em estoque, compras, vendas e producao." columns={2}>
          <InputField name="code" label="Codigo" placeholder="DEP-02" />
          <InputField name="name" label="Descricao" placeholder="Deposito de expedicao" />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar deposito" loadingLabel="Salvando deposito..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Movimentacoes e saldos por local" }]} />
    </form>
  );
}

export function CostCenterForm({ companyId }: { companyId: string }) {
  return (
    <form action={createCostCenter} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Novo centro de custo" description="Base financeira para DRE, compras, vendas e rateios." columns={2}>
          <InputField name="code" label="Codigo" placeholder="CC-ADM" />
          <InputField name="name" label="Descricao" placeholder="Administrativo" />
          <InputField name="dreGroup" label="Grupo DRE" placeholder="Despesas administrativas" />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar centro" loadingLabel="Salvando centro..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Titulos e BI financeiro" }]} />
    </form>
  );
}

export function TaxRuleForm({ companyId }: { companyId: string }) {
  return (
    <form action={createTaxRule} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Nova regra fiscal" description="Base tributaria reutilizada em compras e vendas." columns={2}>
          <InputField name="code" label="Codigo" placeholder="VENDA-RJ" />
          <InputField name="name" label="Descricao" placeholder="Venda interna RJ" />
          <label className="field">
            <span>Operacao</span>
            <select name="operationType" defaultValue="SALE">
              <option value="SALE">Venda</option>
              <option value="PURCHASE">Compra</option>
            </select>
          </label>
          <InputField name="cfopInternal" label="CFOP interno" placeholder="5102" required={false} />
          <InputField name="cstIcms" label="CST ICMS" placeholder="00" required={false} />
          <InputField name="cstPis" label="CST PIS" placeholder="01" required={false} />
          <InputField name="cstCofins" label="CST COFINS" placeholder="01" required={false} />
          <InputField name="icmsRate" label="Aliquota ICMS" type="number" min="0" step="0.01" defaultValue="18" />
          <InputField name="pisRate" label="Aliquota PIS" type="number" min="0" step="0.01" defaultValue="1.65" />
          <InputField name="cofinsRate" label="Aliquota COFINS" type="number" min="0" step="0.01" defaultValue="7.6" />
          <InputField name="issRate" label="Aliquota ISS" type="number" min="0" step="0.01" defaultValue="0" />
          <InputField name="ipiRate" label="Aliquota IPI" type="number" min="0" step="0.01" defaultValue="0" />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar regra fiscal" loadingLabel="Salvando regra..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Documentos fiscais e impostos calculados" }]} />
    </form>
  );
}

export function BomForm({ companyId, products }: any) {
  const finishedProducts = products.filter((item: any) => item.type === "FINISHED_GOOD");
  const components = products.filter((item: any) => item.type !== "SERVICE");

  return (
    <form action={createBom} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Nova BOM" description="Estrutura minima para consumo de insumo e apontamento de acabado." columns={2}>
          <InputField name="code" label="Codigo" placeholder="BOM-PA-010" />
          <InputField name="version" label="Versao" placeholder="1.0" defaultValue="1.0" />
          <SelectField name="productId" label="Produto acabado" options={finishedProducts} labelBuilder={(option) => `${option.sku} - ${option.name}`} />
          <SelectField name="componentId" label="Componente" options={components} labelBuilder={(option) => `${option.sku} - ${option.name}`} />
          <InputField name="quantity" label="Consumo por unidade" type="number" min="0.001" step="0.001" defaultValue="1" />
        </FormSection>
        <ActionBar primary={<SubmitButton label="Salvar BOM" loadingLabel="Salvando BOM..." />} />
      </div>
      <SummaryPanel title="Uso no ERP" rows={[{ label: "Reflexo", value: "Producao e extrato de estoque" }]} />
    </form>
  );
}

export function TaskForm({ companyId }: { companyId: string }) {
  return (
    <form action={createTask} className="erp-form-layout">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="form-stack">
        <FormSection title="Abertura de workflow" description="Padronize chamados internos com modulo, SLA e responsavel." columns={2}>
          <InputField name="title" label="Titulo" placeholder="Descreva a demanda operacional" defaultValue="Revisar fechamento financeiro" />
          <label className="field">
            <span>Modulo</span>
            <select name="module" defaultValue="Financeiro">
              {["Financeiro", "Fiscal", "Compras", "Comercial", "Estoque", "Producao", "RH"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <InputField name="slaHours" label="SLA em horas" type="number" min="1" step="1" defaultValue="8" />
          <InputField name="assignee" label="Responsavel" placeholder="Equipe ou usuario" defaultValue="Backoffice" required={false} />
        </FormSection>

        <ActionBar
          secondary={<span className="helper-text">O prazo e o evento de auditoria sao registrados na abertura.</span>}
          primary={<SubmitButton label="Abrir tarefa interna" loadingLabel="Abrindo tarefa..." />}
        />
      </div>

      <SummaryPanel
        title="Regras de SLA"
        rows={[
          { label: "Controle", value: "Por vencimento" },
          { label: "Auditoria", value: "Evento automatico" },
          { label: "Prioridade", value: "Definida por modulo" }
        ]}
      />
    </form>
  );
}
