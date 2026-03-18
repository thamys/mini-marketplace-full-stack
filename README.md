# Mini Marketplace Full-Stack

Um projeto full-stack de marketplace, desenvolvido em um monorepo para praticar integração ponta-a-ponta, conteinerização e deploy automatizado, abordando conceitos críticos de um Product-grade System.

O repositório é divido em duas frentes fundamentais, em estrutura de Workspaces:

- `/frontend`: Interface construída utilizando Next.js 16 (App Router) + Tailwind CSS.
- `/backend`: API robusta e opinativa construída com NestJS + Prisma ORM e PostgreSQL.

---

## 🚀 Run Instructions (Como Rodar)

Antes de começar, certifique-se de preencher as variáveis ambientes com base no arquivo `.env.example` na raiz:
`cp .env.example .env`

### Opção 1: Via Docker Compartilhado (Recomendado)
A aplicação está conteinerizada, facilitando a orquestração via Docker Compose.
1. Na raiz do projeto, execute o comando (para construir as imagens e subí-las atachando o terminal):
   ```bash
   docker compose up --build
   ```
2. Acesse a interface web em `http://localhost:3000` (e a API backend em `http://localhost:4000`).

### Opção 2: Localmente via PNPM Scripts
Se preferir rodar fora dos contêineres de aplicação:
1. Instale as dependências:
   ```bash
   pnpm install
   ```
2. Inicialize isoladamente a imagem do banco PostgreSQL:
   ```bash
   pnpm run docker:db
   ```
3. Aplique as migrations e povoarándo dados iniciais (admin/produtos):
   ```bash
   pnpm run db:setup
   ```
4. Suba simultaneamente Frontend e Backend via pacote utilitário *concurrently*:
   ```bash
   pnpm run dev
   ```

### Executando Testes e Qualidade
Para assegurar o funcionamento dos contratos na API ou fluxo visuais E2E pelo usuário:
- **Testes Unitários de Backend:** `pnpm -C backend run test`
- **Testes E2E com Playwright (Frontend):** `pnpm -C frontend run e2e`

---

## 🏗️ Design Decisions & Tradeoffs

Para a solução desse case, tomei escolhas tecnológicas intencionais com o objetivo de entregar a melhor combinação de Experiência de Desenvolvedor (DX) e Robustez em Produção.

1. **Next.js com App Router ao envés do Page Router:** 
   Utilização de Server Components diminui brutalmente a parcela de JS enviada ao Browser para renderização, essencial para catálogos com alto volume de links de navegação mantendo o SEO amigável – sem sacrificar componentização "client" (`"use client"`) onde interatividade é compulsória (ex. painéis administrativos, modal de carrinho de compras).
2. **NestJS acoplado via Monorepo:**
   Injeção de dependências robusta permite a construção de rotas através de controladores, isolando a regra de negócio em "services". O uso de monorepo abre portas para, no futuro, criar uma lib de `shared-types` partilhada entre Next Server e a API que lida com o ORM.
3. **Autenticação:**
   O fluxo adota JWT padrão, mas protegendo adequadamente o painel via validações enums de Role (Customer x Admin) e focando a proteção de roteamento na camada de middlewares do cliente visando UX (segurar piscar visuais e transições nulas de tela ao verificar credenciais incorretas).

### Tradeoffs Notórios:

* **Ausência de Integração de Pagamento:** Optou-se por não implementar um gateway de pagamento real de terceiros (como Stripe ou PayPal). Como se trata de um teste técnico, o principal objetivo é avaliar minha capacidade arquitetural, estruturação do código-fonte (Next.js, NestJS, banco de dados) e boas práticas em lidar com o domínio do negócio, e não a habilidade de ler documentação de APIs externas. A rotina de checkout apenas efetua o registro lógico da `Order` no banco de dados.
* **Carrinho Efêmero:** A manipulação dos itens incluídos em carrinho pode ocorrer primariamente na memória/session client-side até a emissão do pedido, em pró de reduzir chamadas inócuas a API enquanto o pedido não for faturado (apesar desta escolha invalidar persistência do carrinho caso o cliente vá do App ao Desktop simultâaneamente).
* **Ausência de Filas/Workers Assíncronos:** Compras sendo cadastradas como transações transacionais diretas síncronas evitam overengineering no desafio em detrimento a de tolerância a falhas na manipulação de alto rps caso se escalasse infinitamente amanhã.

### What I would build Next? (Próximos Passos):
* Paginação aprimorada via Service Workers ou Edge Functions;
* Adição de sistema de Caching (Redis) blindando o tráfego do endpoint `GET /products`;
* Adição do Checkout/Gateway de pagamento Stripe;
* Upload dinâmico de `imageUrls` aos provedores da AWS (S3).

---

## 🏁 Épicos e Roadmap do Projeto original

O desenvolvimento deste mini-marketplace foi estruturado em **5 épicos principais**, guiando da infraestrutura inicial até o deploy e qualidade final em produção:

### E1 — Inicialização & Configuração
Setup inicial do workspace (PNPM), containerização do ambiente com Docker, configuração rígida do TypeScript e do CI/CD automatizado via GitHub Actions e Render.

### E2 — Autenticação
Implementação de registro de usuários e login baseado em tokens JWT, com hash seguro de senhas (bcrypt), middlewares para proteção das rotas privadas e de admin.

### E3 — Produtos
Desenvolvimento do catálogo de produtos público (com paginação e filtros textuais/categoria) e de áreas restritas para Administradores gerirem o inventário via operações CRUD. Foco em interfaces limpas e acessíveis.

### E4 — Pedidos
Construção do carrinho de compras client-side, fluxo de checkout protegido por autenticação para registrar a venda e exibição de histórico aos usuários logados.

### E5 — Qualidade & Entrega
Fase final voltada à confiabilidade: cobertura exaustiva de testes unitários (Jest), cenários de integração ponta-a-ponta robustos no frontend (Playwright) e polimento geral para entrega de produção.

---

---

### 📄 Documentação Anexa e Acompanhamento

- [**`assessment.md`**](./assessment.md): Descrição original do desafio técnico recebido contendo as regras de negócio e requisitos estritos da avaliação.
- [**`system-design.md`**](./system-design.md): Arquitetura concebida do sistema em diagramas C4 e de Entidade Relacionamento (ERD) documentada através de notação Mermaid.
- [**`mock-interview.md`**](./mock-interview.md): Simulação de perguntas de entrevista para embasar raciocínio de escolhas dos frameworks/tradeoffs e visão de escala no e-commerce.
- [**Planos de Implementação (`.agent/plans`)**](./.agent/plans): Histórico de planos técnicos elaborados individualmente para as tasks, estratégias de testes e arquitetura iterados por etapa na construção da aplicação.

---

_Este repositório conta também com o utilitário `scripts/github-import.js` empregado durante o desenvolvimento para espelhar as atividades no painel do GitHub Projects._
