"use client";

import { useState, useMemo } from "react";
import { BookOpen, Search, ChevronRight, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

type Article = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type Section = {
  id: string;
  label: string;
  articles: Article[];
};

// ── Content ───────────────────────────────────────────────────────────────

const KB: Section[] = [
  {
    id: "inicio",
    label: "Primeiros Passos",
    articles: [
      {
        id: "introducao",
        title: "Introdução ao Winner ERP",
        content: (
          <div className="kb-article-body">
            <p>O <strong>Winner ERP 3.0</strong> é um sistema de gestão integrada desenvolvido para academias e clubes esportivos. Ele centraliza operações comerciais, financeiras, fiscais, de estoque, produção, cadastros e gestão de alunos em um único painel.</p>
            <h3>Perfis de acesso</h3>
            <table className="kb-table">
              <thead><tr><th>Perfil</th><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td><strong>OWNER</strong></td><td>Acesso total, incluindo configurações e usuários</td></tr>
                <tr><td><strong>ADMIN</strong></td><td>Acesso operacional completo, sem configurações/usuários</td></tr>
                <tr><td><strong>FINANCE</strong></td><td>Lançamentos financeiros e visualização</td></tr>
                <tr><td><strong>MANAGER</strong></td><td>Cadastro de alunos e visualização financeira</td></tr>
              </tbody>
            </table>
          </div>
        ),
      },
      {
        id: "login",
        title: "Como fazer login",
        content: (
          <div className="kb-article-body">
            <h3>Login administrativo</h3>
            <ol>
              <li>Acesse a URL do sistema</li>
              <li>Informe CNPJ, e-mail e senha</li>
              <li>Clique em <strong>Entrar</strong></li>
            </ol>
            <h3>Portal do Aluno</h3>
            <ol>
              <li>Acesse <code>/cliente</code> ou use o link compartilhado</li>
              <li>Informe o CPF e senha de primeiro acesso</li>
              <li>Clique em <strong>Entrar</strong></li>
            </ol>
          </div>
        ),
      },
      {
        id: "config-inicial",
        title: "Configuração inicial do sistema",
        content: (
          <div className="kb-article-body">
            <p>Antes de iniciar as operações, configure os dados base na ordem abaixo. Os itens 2 a 6 são feitos todos em <code>/cadastros</code>.</p>
            <ol>
              <li>Configure os dados da empresa em <strong>Configurações</strong> (aba Empresa)</li>
              <li>Cadastre os <strong>Depósitos</strong> — campos: Código e Descrição</li>
              <li>Cadastre os <strong>Centros de Custo</strong> — campos: Código, Descrição e Grupo DRE</li>
              <li>Cadastre as <strong>Regras Fiscais</strong> — campos: Código, Descrição, Operação, CFOP, CST, alíquotas ICMS/PIS/COFINS/ISS</li>
              <li>Cadastre os <strong>Produtos</strong> — campos: SKU, Nome, Tipo, Unidade, Regra Fiscal, Preço de custo e venda</li>
              <li>Cadastre <strong>Clientes</strong> e <strong>Fornecedores</strong> — campos: Razão Social, Nome Fantasia, CNPJ/CPF, E-mail, Telefone, Cidade, UF</li>
              <li>Configure as chaves de pagamento em <strong>Configurações</strong> (aba Pagamentos): PIX, Mercado Pago, PagSeguro</li>
            </ol>
            <div className="kb-tip">Todos os cadastros devem ser feitos antes de iniciar operações transacionais (vendas, compras, produção).</div>
          </div>
        ),
      },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    articles: [
      {
        id: "dashboard-visao",
        title: "Visão geral do Dashboard",
        content: (
          <div className="kb-article-body">
            <p>O dashboard (<code>/dashboard</code>) exibe uma visão geral financeira em tempo real.</p>
            <table className="kb-table">
              <thead><tr><th>Indicador</th><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td>A Receber</td><td>Total de contas a receber em aberto</td></tr>
                <tr><td>A Pagar</td><td>Total de contas a pagar em aberto</td></tr>
                <tr><td>Em Atraso</td><td>Valores vencidos e não pagos</td></tr>
                <tr><td>Saldo Líquido</td><td>Diferença entre recebíveis e pagamentos</td></tr>
              </tbody>
            </table>
            <h3>Tabelas disponíveis</h3>
            <ul>
              <li>Contas a receber com botão <strong>Cobrar</strong> (gera link de pagamento)</li>
              <li>Contas a pagar</li>
              <li>Aging — vencimentos por faixa de prazo</li>
              <li>Top 7 alunos com pendências</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    articles: [
      {
        id: "criar-pedido-venda",
        title: "Criar pedido de venda",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/comercial</code> para gerenciar pedidos de venda.</p>
            <ol>
              <li>Clique em <strong>Novo Pedido</strong></li>
              <li>Selecione o <strong>Cliente</strong>, <strong>Centro de Custo</strong>, <strong>Regra Fiscal</strong> e <strong>Depósito</strong></li>
              <li>Adicione os produtos com quantidade, preço unitário e desconto</li>
              <li>Clique em <strong>Salvar</strong></li>
            </ol>
            <h3>O que o sistema faz automaticamente</h3>
            <ul>
              <li>Gera a Nota Fiscal (NF-e)</li>
              <li>Cria as parcelas a receber conforme condição de pagamento</li>
              <li>Registra saída de estoque (OUTBOUND)</li>
              <li>Registra auditoria da operação</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    articles: [
      {
        id: "registrar-compra",
        title: "Registrar ordem de compra",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/compras</code> para registrar entradas de mercadoria.</p>
            <ol>
              <li>Clique em <strong>Nova Compra</strong></li>
              <li>Preencha: Fornecedor, Centro de Custo, Regra Fiscal, Depósito, Número do documento e Chave XML</li>
              <li>Adicione os produtos com quantidade e preço unitário</li>
              <li>Clique em <strong>Salvar</strong></li>
            </ol>
            <h3>O que o sistema faz automaticamente</h3>
            <ul>
              <li>Entrada de estoque (INBOUND)</li>
              <li>Gera conta a pagar (prazo padrão: 15 dias)</li>
              <li>Gera Nota Fiscal de entrada</li>
              <li>Registra auditoria</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    articles: [
      {
        id: "lancamento-manual",
        title: "Lançamento manual financeiro",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/financeiro</code> para gerenciar contas a receber e a pagar.</p>
            <ol>
              <li>Clique em <strong>Novo Lançamento</strong></li>
              <li>Preencha: Descrição, Tipo (Recebível ou Pagável), Categoria, Vencimento, Centro de Custo e Valor</li>
              <li>Clique em <strong>Salvar</strong></li>
            </ol>
          </div>
        ),
      },
      {
        id: "importar-extrato",
        title: "Importar extrato bancário",
        content: (
          <div className="kb-article-body">
            <ol>
              <li>Clique em <strong>Importar Extrato</strong></li>
              <li>Informe os lançamentos (descrição, valor, data)</li>
              <li>O sistema tenta conciliar automaticamente com lançamentos existentes</li>
              <li>Confirme a importação</li>
            </ol>
          </div>
        ),
      },
      {
        id: "cobrar-cliente",
        title: "Cobrar cliente",
        content: (
          <div className="kb-article-body">
            <p>Na tabela de recebíveis, clique em <strong>Cobrar</strong>. O sistema gera um link de pagamento que pode ser enviado ao cliente via WhatsApp ou e-mail.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    articles: [
      {
        id: "estoque-visao",
        title: "Visualizar saldo e movimentações",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/estoque</code>. Esta tela é somente leitura — os movimentos são gerados automaticamente.</p>
            <table className="kb-table">
              <thead><tr><th>Tipo de Movimento</th><th>Origem</th></tr></thead>
              <tbody>
                <tr><td>INBOUND</td><td>Entrada por compra</td></tr>
                <tr><td>OUTBOUND</td><td>Saída por venda</td></tr>
                <tr><td>PRODUCTION_CONSUMPTION</td><td>Consumo em produção</td></tr>
                <tr><td>PRODUCTION_FINISHED</td><td>Produto acabado</td></tr>
              </tbody>
            </table>
          </div>
        ),
      },
    ],
  },
  {
    id: "producao",
    label: "Produção",
    articles: [
      {
        id: "cadastrar-bom",
        title: "Cadastrar Lista de Materiais (BOM)",
        content: (
          <div className="kb-article-body">
            <ol>
              <li>Acesse <code>/producao</code> e abra a aba <strong>BOM</strong></li>
              <li>Clique em <strong>Nova BOM</strong></li>
              <li>Preencha: Produto acabado, Componente, Código/versão e Quantidade por unidade produzida</li>
              <li>Clique em <strong>Salvar</strong></li>
            </ol>
          </div>
        ),
      },
      {
        id: "ordem-producao",
        title: "Criar ordem de produção",
        content: (
          <div className="kb-article-body">
            <ol>
              <li>Clique em <strong>Nova Ordem de Produção</strong></li>
              <li>Preencha: Produto, Depósito de saída e Quantidade</li>
              <li>Clique em <strong>Finalizar Produção</strong></li>
            </ol>
            <p>O sistema consome os componentes da BOM e adiciona o produto acabado ao estoque automaticamente.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    articles: [
      {
        id: "cadastros-master",
        title: "Mestre de dados",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/cadastros</code> para registrar todas as entidades base do sistema.</p>
            <table className="kb-table">
              <thead><tr><th>Entidade</th><th>Campos</th></tr></thead>
              <tbody>
                <tr><td><strong>Produto</strong></td><td>SKU, Nome, Tipo, Unidade, Regra Fiscal, Preço de custo, Preço de venda</td></tr>
                <tr><td><strong>Cliente</strong></td><td>Razão Social, Nome Fantasia, CNPJ/CPF, E-mail, Telefone, Cidade, UF</td></tr>
                <tr><td><strong>Fornecedor</strong></td><td>Razão Social, Nome Fantasia, CNPJ/CPF, E-mail, Telefone, Cidade, UF</td></tr>
                <tr><td><strong>Depósito</strong></td><td>Código, Descrição</td></tr>
                <tr><td><strong>Centro de Custo</strong></td><td>Código, Descrição, Grupo DRE</td></tr>
                <tr><td><strong>Regra Fiscal</strong></td><td>Código, Descrição, Operação (Venda/Compra), CFOP, CST ICMS/PIS/COFINS, alíquotas ICMS/PIS/COFINS/ISS</td></tr>
              </tbody>
            </table>
            <div className="kb-tip">A tabela de Pessoas (clientes, fornecedores e colaboradores) é atualizada automaticamente após cada cadastro.</div>
          </div>
        ),
      },
    ],
  },
  {
    id: "alunos",
    label: "Alunos & Aulas",
    articles: [
      {
        id: "cadastrar-aluno",
        title: "Cadastrar aluno",
        content: (
          <div className="kb-article-body">
            <ol>
              <li>Acesse <code>/cadastro</code></li>
              <li>Preencha: Nome, CPF, E-mail, Telefone, Cidade, Estado</li>
              <li>Marque <strong>Ativar portal do aluno</strong> para liberar acesso</li>
              <li>Clique em <strong>Salvar</strong></li>
            </ol>
          </div>
        ),
      },
      {
        id: "agendar-aula",
        title: "Compartilhar link de agendamento",
        content: (
          <div className="kb-article-body">
            <p>Em <code>/aulas</code>, copie o <strong>Link de Agendamento</strong> ou escaneie o <strong>QR Code</strong> e compartilhe via WhatsApp com os alunos.</p>
            <p>O aluno acessa o link, seleciona a data e aula disponível e confirma o agendamento em <code>/agendar</code>.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "portal-aluno",
    label: "Portal do Aluno",
    articles: [
      {
        id: "portal-login",
        title: "Acesso ao portal do aluno",
        content: (
          <div className="kb-article-body">
            <ol>
              <li>Acesse o link enviado pela academia</li>
              <li>Informe CPF e senha de primeiro acesso</li>
              <li>Clique em <strong>Entrar</strong></li>
            </ol>
          </div>
        ),
      },
      {
        id: "portal-pagamento",
        title: "Pagar cobrança pelo portal",
        content: (
          <div className="kb-article-body">
            <ol>
              <li>Acesse <code>/cliente/cobrancas</code></li>
              <li>Na seção <strong>Em Aberto</strong>, clique em <strong>Pagar</strong></li>
              <li>Escolha Mercado Pago ou PagSeguro</li>
              <li>Conclua o pagamento na plataforma escolhida</li>
            </ol>
          </div>
        ),
      },
    ],
  },
  {
    id: "bi-relatorios",
    label: "BI & Relatórios",
    articles: [
      {
        id: "bi-visao",
        title: "Painel de Business Intelligence",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/bi</code> para visualizar dados consolidados:</p>
            <table className="kb-table">
              <thead><tr><th>Indicador</th><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td>Receita</td><td>Total de vendas realizadas</td></tr>
                <tr><td>Despesa</td><td>Total de contas pagas</td></tr>
                <tr><td>Valor em Estoque</td><td>Custo total do inventário</td></tr>
                <tr><td>Resultado Operacional</td><td>Receita menos Despesa</td></tr>
              </tbody>
            </table>
            <p>Também exibe DRE simplificado e top produtos em estoque por valor.</p>
          </div>
        ),
      },
      {
        id: "relatorios",
        title: "Gerar relatórios",
        content: (
          <div className="kb-article-body">
            <p>Acesse <code>/relatorios</code> e selecione o tipo:</p>
            <ul>
              <li>Resumo Geral</li>
              <li>Contas a Receber</li>
              <li>Contas a Pagar</li>
              <li>Títulos Liquidados</li>
              <li>Aging (vencimentos)</li>
              <li>Alunos</li>
            </ul>
            <p>Clique em gerar para exportar ou imprimir.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    articles: [
      {
        id: "config-empresa",
        title: "Dados da empresa",
        content: (
          <div className="kb-article-body">
            <p>Em <code>/configuracoes</code> (somente OWNER), aba <strong>Empresa</strong>:</p>
            <ul>
              <li>Atualize Nome Fantasia, CNPJ, Endereço, Telefone e E-mail</li>
            </ul>
          </div>
        ),
      },
      {
        id: "config-pagamentos",
        title: "Configurar meios de pagamento",
        content: (
          <div className="kb-article-body">
            <p>Aba <strong>Pagamentos</strong> em Configurações:</p>
            <ul>
              <li>Chave PIX — adicionar, editar ou remover</li>
              <li>Token Mercado Pago</li>
              <li>Token PagSeguro (ambiente sandbox ou produção)</li>
            </ul>
          </div>
        ),
      },
      {
        id: "config-usuarios",
        title: "Gerenciar usuários",
        content: (
          <div className="kb-article-body">
            <p>Aba <strong>Usuários</strong> em Configurações:</p>
            <ol>
              <li>Clique em <strong>Adicionar Usuário</strong></li>
              <li>Preencha: Nome, E-mail, Senha e Perfil (ADMIN / FINANCE / MANAGER)</li>
            </ol>
            <div className="kb-tip">Visualize a matriz de permissões por perfil para entender o que cada usuário pode acessar.</div>
          </div>
        ),
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function flatArticles(sections: Section[]) {
  return sections.flatMap((s) => s.articles.map((a) => ({ ...a, sectionId: s.id, sectionLabel: s.label })));
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AjudaPage() {
  const [search, setSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(KB[0].id);
  const [activeArticleId, setActiveArticleId] = useState(KB[0].articles[0].id);

  const all = useMemo(() => flatArticles(KB), []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.sectionLabel.toLowerCase().includes(q)
    );
  }, [search, all]);

  const activeSection = KB.find((s) => s.id === activeSectionId) ?? KB[0];
  const activeArticle =
    activeSection.articles.find((a) => a.id === activeArticleId) ??
    activeSection.articles[0];

  function openArticle(sectionId: string, articleId: string) {
    setActiveSectionId(sectionId);
    setActiveArticleId(articleId);
    setSearch("");
  }

  return (
    <div className="kb-page">
      {/* Header */}
      <div className="kb-header">
        <div className="kb-header-left">
          <BookOpen size={20} strokeWidth={2} />
          <div>
            <div className="kb-header-title">Central de Ajuda</div>
            <div className="kb-header-sub">Documentação completa do Winner ERP</div>
          </div>
        </div>
        <div className="kb-search-wrap">
          <Search size={14} className="kb-search-icon" />
          <input
            className="kb-search"
            placeholder="Buscar tópico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="kb-search-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {search && (
        <div className="kb-results">
          {results.length === 0 ? (
            <div className="kb-results-empty">Nenhum resultado para &ldquo;{search}&rdquo;</div>
          ) : (
            results.map((a) => (
              <button
                key={a.id}
                className="kb-result-item"
                onClick={() => openArticle(a.sectionId, a.id)}
              >
                <span className="kb-result-section">{a.sectionLabel}</span>
                <ChevronRight size={12} />
                <span className="kb-result-title">{a.title}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Body */}
      {!search && (
        <div className="kb-body">
          {/* Sidebar */}
          <nav className="kb-nav">
            {KB.map((section) => (
              <div key={section.id} className="kb-nav-section">
                <div className="kb-nav-section-label">{section.label}</div>
                {section.articles.map((article) => (
                  <button
                    key={article.id}
                    className={
                      "kb-nav-item" +
                      (activeArticleId === article.id ? " active" : "")
                    }
                    onClick={() => openArticle(section.id, article.id)}
                  >
                    <ChevronRight size={12} className="kb-nav-chevron" />
                    {article.title}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Article */}
          <article className="kb-article">
            <div className="kb-article-breadcrumb">
              {activeSection.label} &rsaquo; {activeArticle.title}
            </div>
            <h1 className="kb-article-title">{activeArticle.title}</h1>
            {activeArticle.content}
          </article>
        </div>
      )}
    </div>
  );
}
