# Mini Marketplace Full-Stack

Um projeto full-stack de marketplace, desenvolvido em um monorepo para praticar integração ponta-a-ponta, conteinerização e deploy automatizado.

O repositório é divido em:

- `/frontend` (Next.js 16 + Tailwind CSS)
- `/backend` (NestJS + Prisma + PostgreSQL)

## 🏁 Épicos e Roadmap do Projeto

O desenvolvimento deste mini-marketplace está estruturado em **5 épicos principais**, guiando da infraestrutura inicial até o deploy e qualidade final em produção:

### E1 — Inicialização & Configuração

Setup inicial do workspace (PNPM), containerização do ambiente com Docker, configuração rígida do TypeScript e do CI/CD automatizado via GitHub Actions e Render.

### E2 — Autenticação

Implementação de registro de usuários e login baseado em tokens JWT, com hash seguro de senhas (bcrypt), cookies httpOnly para a web e middlewares para proteção das rotas privadas e de admin.

### E3 — Produtos

Desenvolvimento do catálogo de produtos público (com paginação e filtros textuais/categoria) e de áreas restritas para Administradores gerirem o inventário via operações CRUD. Foco em interfaces limpas e acessíveis.

### E4 — Pedidos

Construção do carrinho de compras client-side, fluxo de checkout protegido por autenticação para registrar a venda e exibição de histórico aos usuários logados.

### E5 — Qualidade & Entrega

Fase final voltada à confiabilidade: cobertura exaustiva de testes unitários (Jest), cenários de integração ponta-a-ponta robustos no frontend (Cypress) e polimento geral para entrega de produção.

---

_Este repositório está utilizando o script `scripts/github-import.js` para popular e acompanhar as atividades de cada épico via GitHub Projects._
