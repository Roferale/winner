# ERP 3.0

ERP SaaS multi-tenant para operacoes brasileiras, com base modular cobrindo financeiro, fiscal, vendas, compras, estoque, producao, RH, auditoria e BI.

## Stack

- Backend: Node.js + TypeScript + Express estruturado
- Frontend: Next.js 14 App Router
- Banco: PostgreSQL + Prisma
- Auth: JWT + Refresh Token + RBAC
- Mensageria: BullMQ-ready com Redis
- Monorepo: npm workspaces

## Estrutura

```text
apps/
  api/
  web/
packages/
  config/
  database/
  ui/
```

## Observacao

A base entregue aqui prioriza arquitetura, dominio e fluxos transacionais centrais. Integracoes fiscais com SEFAZ/prefeituras e layout SPED foram deixadas desacopladas para evolucao segura.
