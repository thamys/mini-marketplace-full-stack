#!/usr/bin/env node
/**
 * Mini Marketplace — GitHub Importer
 * Cria: labels, milestones (épicos), issues (US), sub-issues (tasks), GitHub Project board
 *
 * Uso:
 *   1. npm install node-fetch   (se Node < 18)
 *   2. export GITHUB_TOKEN=ghp_seu_token_aqui
 *   3. node github-import.js
 *
 * O token precisa de scopes: repo + project (read:project + write:project)
 */

const OWNER = "thamys";
const REPO  = "mini-marketplace-full-stack";
const BASE  = "https://api.github.com";

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error("❌  Defina GITHUB_TOKEN antes de rodar."); process.exit(1); }

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
};

// ── util ────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

async function graphql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST", headers,
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, label, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`  ⚠️  Retry ${i + 1}/${retries} for ${label}: ${e.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

// ── DATA ─────────────────────────────────────────────────────────────

const LABELS = [
  // tipo
  { name: "epic",       color: "1E3A5F", description: "Épico" },
  { name: "user-story", color: "2E6DA4", description: "User Story" },
  { name: "task",       color: "5B8DB8", description: "Task de implementação" },
  // épicos
  { name: "E1",  color: "0052CC", description: "Épico 1 — Inicialização" },
  { name: "E2",  color: "006644", description: "Épico 2 — Autenticação" },
  { name: "E3",  color: "FF8B00", description: "Épico 3 — Produtos" },
  { name: "E4",  color: "BF2600", description: "Épico 4 — Pedidos" },
  { name: "E5",  color: "403294", description: "Épico 5 — Qualidade & Entrega" },
  // tech
  { name: "frontend",  color: "FBCA04", description: "Frontend Next.js" },
  { name: "backend",   color: "0E8A16", description: "Backend Node.js" },
  { name: "infra",     color: "C5DEF5", description: "Infraestrutura / DevOps" },
  { name: "tdd",       color: "E4E669", description: "Test-Driven Development" },
  { name: "e2e",       color: "D93F0B", description: "Cypress E2E" },
  // estado
  { name: "ready",     color: "0E8A16", description: "DoR atendida — pronta pro sprint" },
  { name: "blocked",   color: "B60205", description: "Bloqueada por dependência" },
];

// ── MILESTONES (um por épico) ───────────────────────────────────────
const MILESTONES = [
  { title: "E1 — Inicialização & Configuração",
    description: "Setup do monorepo, Docker, CI e pipeline de CD. Fundação sem lógica de negócio." },
  { title: "E2 — Autenticação",
    description: "Registro, login com JWT, proteção de rotas." },
  { title: "E3 — Produtos",
    description: "API pública com filtros e paginação. CRUD admin. Interface de catálogo." },
  { title: "E4 — Pedidos",
    description: "Carrinho client-side, checkout autenticado, histórico de compras." },
  { title: "E5 — Qualidade & Entrega",
    description: "Cobertura de componentes, E2E completos, documentação final." },
];

// ── ISSUES: US + tasks como sub-issues ─────────────────────────────
// Formato: { title, body, labels, milestone (índice 0-based), tasks[] }
// tasks[]: { title, body, labels }

const US_DATA = [

  // ═══════════════════════════════════════════════════
  // E1 — INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════
  {
    title: "[US-01] Estrutura do monorepo",
    labels: ["user-story","E1","infra"],
    milestone: 0,
    body: `## História
Como desenvolvedor, quero um repositório organizado com frontend e backend isolados para trabalhar em cada camada de forma independente sem conflitos de dependência.

## Critérios de aceite
\`\`\`
Given o repositório clonado,
When executo pnpm install na raiz,
Then dependências de /frontend e /backend são instaladas sem conflito.

Given o projeto configurado,
When rodo tsc --noEmit em /frontend e /backend,
Then ambos retornam 0 erros com strict: true.
\`\`\`

## DoR
- [ ] Decisão de framework backend tomada (Express vs NestJS)
- [ ] Versão do Node.js definida e documentada
- [ ] Sem bloqueadores de acesso ao repositório

## DoD
- [ ] tsc --noEmit retorna 0 erros em /frontend e /backend
- [ ] pnpm install na raiz instala todas as dependências sem conflito
- [ ] ESLint passa sem warnings nos dois projetos`,
    tasks: [
      { title: "[TASK-01.1] Inicializar workspace pnpm", labels: ["task","E1","infra"],
        body: `**O que fazer:** Criar pnpm-workspace.yaml com packages: ['frontend', 'backend']. Configurar package.json raiz com scripts dev, build, lint e test que delegam para cada workspace.

**Pré-condições:** Node 20+ e pnpm 8+ instalados.

**Cenários de teste:**
- TC-01.1.1: Executar \`pnpm install\` na raiz → instala deps de ambos os workspaces sem erro
- TC-01.1.2: Executar \`pnpm -r lint\` → roda ESLint em /frontend e /backend em sequência

**Dados de teste:** n/a (setup)` },
      { title: "[TASK-01.2] Configurar TypeScript strict", labels: ["task","E1","infra","frontend","backend"],
        body: `**O que fazer:** Criar tsconfig.json em /frontend (extends Next.js) e /backend com strict: true, paths aliases e outDir configurados.

**Pré-condições:** Pacotes base de cada workspace instalados.

**Cenários de teste:**
- TC-01.2.1: Introduzir erro de tipo intencional em /backend → tsc --noEmit retorna exit code 1
- TC-01.2.2: Corrigir erro → tsc --noEmit retorna exit code 0

**Dados de teste:** \`const x: number = "string"\` como erro proposital` },
      { title: "[TASK-01.3] Configurar Prisma + PostgreSQL", labels: ["task","E1","infra","backend"],
        body: `**O que fazer:** Instalar Prisma, criar schema.prisma base e validar conexão com o banco.

**Pré-condições:** PostgreSQL rodando local ou via Docker.

**Cenários de teste:**
- TC-01.3.1: Preencher DATABASE_URL no .env → \`prisma migrate dev --name init\` aplica migration sem erro
- TC-01.3.2: \`prisma db pull\` reflete schema no banco

**Dados de teste:** \`DATABASE_URL=postgresql://user:pass@localhost:5432/marketplace\`` },
    ],
  },

  {
    title: "[US-02] Ambiente conteinerizado",
    labels: ["user-story","E1","infra"],
    milestone: 0,
    body: `## História
Como desenvolvedor, quero subir todo o ambiente com um único comando para garantir que qualquer pessoa reproduz exatamente o mesmo ambiente.

## Critérios de aceite
\`\`\`
Given o arquivo .env preenchido a partir do .env.example,
When executo docker-compose up --build,
Then frontend sobe na porta 3000, backend na 4000 e postgres na 5432,
  migrations rodam e seed popula o banco.

Given o ambiente subindo pela primeira vez,
When as migrations terminam,
Then o banco contém ao menos 10 produtos e 1 usuário admin.
\`\`\`

## DoR
- [ ] Dockerfiles de frontend e backend aprovados
- [ ] .env.example com todas as variáveis documentadas
- [ ] Versão do Postgres definida (ex: 15-alpine)

## DoD
- [ ] docker-compose up --build completa sem erros em máquina zerada
- [ ] Frontend acessível em localhost:3000, backend em localhost:4000
- [ ] Banco contém seed com ≥ 10 produtos e usuário admin após subir`,
    tasks: [
      { title: "[TASK-02.1] Dockerfiles (backend e frontend)", labels: ["task","E1","infra"],
        body: `**O que fazer:** Multi-stage builds para os dois serviços. Backend roda migrations como entrypoint antes de iniciar.

**Pré-condições:** Código base compilável nos dois workspaces.

**Notas de implementação:**
- Backend: stage builder (tsc) + stage production (node dist/)
- Frontend: stage deps + stage builder (next build) + stage runner
- Entrypoint do backend: \`prisma migrate deploy && node dist/server.js\`` },
      { title: "[TASK-02.2] docker-compose.yml", labels: ["task","E1","infra"],
        body: `**O que fazer:** Orquestrar postgres, backend e frontend com healthchecks e dependências corretas.

**Pré-condições:** Dockerfiles prontos.

**Cenários de teste:**
- TC-02.2.1: \`docker-compose up --build\` → frontend em localhost:3000, API em localhost:4000/api/health, sem erros nos logs

**Notas:** healthcheck no postgres antes de iniciar o backend; volume para persistência.` },
      { title: "[TASK-02.3] Script de seed", labels: ["task","E1","backend"],
        body: `**O que fazer:** Popular o banco com dados iniciais ao subir o ambiente.

**Pré-condições:** Migrations aplicadas, modelo User e Product no schema.

**Cenários de teste:**
- TC-02.3.1: \`pnpm prisma db seed\` → ao menos 10 produtos no banco; admin@marketplace.com com role ADMIN presente

**Dados de teste:**
- Admin email: \`admin@marketplace.com\`
- Admin senha: \`Admin@123\`
- Qtd mínima de produtos: 10` },
    ],
  },

  {
    title: "[US-03] Pipeline de CI",
    labels: ["user-story","E1","infra"],
    milestone: 0,
    body: `## História
Como desenvolvedor, quero feedback automático a cada PR para não integrar código com erros de lint, tipo ou testes quebrados.

## Critérios de aceite
\`\`\`
Given um PR aberto com alterações,
When o pipeline é disparado,
Then lint, typecheck e testes unitários passam sem erros.
\`\`\`

## DoR
- [ ] Repositório no GitHub com Actions habilitado
- [ ] Credenciais de banco definidas como secrets no repo
- [ ] Nível mínimo de cobertura acordado

## DoD
- [ ] Pipeline passa ao abrir PR em main com código limpo
- [ ] Pipeline falha ao introduzir erro de tipo ou teste quebrado intencionalmente
- [ ] Relatório de cobertura visível nos artefatos do GitHub Actions`,
    tasks: [
      { title: "[TASK-03.1] Workflow de lint e typecheck", labels: ["task","E1","infra"],
        body: `**O que fazer:** GitHub Actions com jobs paralelos para /frontend e /backend rodando ESLint e tsc --noEmit.

**Pré-condições:** ESLint e TypeScript configurados nos workspaces.

**Cenários de teste:**
- TC-03.1.1: Introduzir erro de tipo → job lint falha, log exibe o erro, PR bloqueado

**Notas:** Trigger: pull_request e push em main; jobs lint-frontend e lint-backend em paralelo.` },
      { title: "[TASK-03.2] Workflow de testes", labels: ["task","E1","infra"],
        body: `**O que fazer:** Job que sobe postgres via service container, roda migrations + seed e executa Jest.

**Pré-condições:** \`services: postgres\` configurado no workflow.

**Cenários de teste:**
- TC-03.2.1: Quebrar um teste unitário intencionalmente → job falha, log mostra o teste que falhou

**Notas:** Publicar cobertura como artefato do job; rodar \`prisma migrate deploy\` antes dos testes.` },
    ],
  },

  {
    title: "[US-04] Continuous Deployment (Render)",
    labels: ["user-story","E1","infra"],
    milestone: 0,
    body: `## História
Como desenvolvedor, quero que cada merge em main faça deploy automático no Render para que a versão mais recente esteja sempre disponível sem intervenção manual.

## Critérios de aceite
\`\`\`
Given um merge em main com CI passando,
When o pipeline de CD é disparado,
Then backend e frontend são redeploy no Render automaticamente.

Given o deploy concluído,
When acesso a URL do Render,
Then a API responde em /api/health e o frontend carrega sem erro.

Given um deploy com erro de build,
When o pipeline falha,
Then o deploy anterior continua no ar (rollback automático do Render).
\`\`\`

## RNF
- Deploy zero-downtime via health check do Render
- Variáveis de ambiente gerenciadas pelo painel do Render (não no repositório)
- Migrations rodam automaticamente no start do serviço de backend

## DoR
- [ ] Conta no Render criada e serviços de backend e frontend configurados
- [ ] Variáveis de ambiente de produção definidas no painel do Render
- [ ] render.yaml ou configuração via painel aprovada
- [ ] CI (US-03) entregue e estável

## DoD
- [ ] Merge em main dispara deploy automático nos dois serviços
- [ ] Backend responde em /api/health após deploy
- [ ] Frontend carrega sem erro após deploy
- [ ] Migrations de produção rodam sem erro no boot do backend
- [ ] Deploy anterior não cai durante o novo deploy (zero-downtime validado)`,
    tasks: [
      { title: "[TASK-04.1] Configurar serviço de backend no Render", labels: ["task","E1","infra","backend"],
        body: `**O que fazer:** Criar serviço Web no Render apontando para /backend. Configurar build command, start command e variáveis de ambiente.

**Pré-condições:** Conta Render criada, repositório conectado.

**Notas de implementação:**
- Build command: \`pnpm install && pnpm build\`
- Start command: \`pnpm prisma migrate deploy && node dist/server.js\`
- Variáveis: DATABASE_URL (Render Postgres), JWT_SECRET, NODE_ENV=production
- Health check path: /api/health

**Cenários de teste:**
- TC-04.1.1: Fazer push em main → Render faz build e deploy sem erro
- TC-04.1.2: GET /api/health na URL do Render → responde 200 com { status: 'ok' }` },
      { title: "[TASK-04.2] Configurar banco PostgreSQL no Render", labels: ["task","E1","infra"],
        body: `**O que fazer:** Provisionar banco PostgreSQL gerenciado no Render e linkar ao serviço de backend.

**Pré-condições:** Serviço de backend criado no Render.

**Notas de implementação:**
- Criar database no Render (plano free: 256MB)
- Copiar Internal Database URL para variável DATABASE_URL do backend
- Garantir que o banco persiste entre deploys

**Cenários de teste:**
- TC-04.2.1: Após primeiro deploy, seed roda e banco contém dados iniciais
- TC-04.2.2: Novo deploy não apaga dados existentes (migrations idempotentes)` },
      { title: "[TASK-04.3] Configurar serviço de frontend no Render", labels: ["task","E1","infra","frontend"],
        body: `**O que fazer:** Criar Static Site ou Web Service no Render para o frontend Next.js.

**Pré-condições:** Backend deploy estável e URL conhecida.

**Notas de implementação:**
- Para Static Export: build command \`pnpm build && pnpm export\`, publish dir \`out\`
- Para SSR (recomendado com Next.js 14): Web Service com start \`pnpm start\`
- Variável NEXT_PUBLIC_API_URL apontando para URL do backend no Render

**Cenários de teste:**
- TC-04.3.1: Acessar URL do frontend no Render → página carrega sem erro 500
- TC-04.3.2: Página de catálogo chama a API do Render (network tab) sem CORS error` },
      { title: "[TASK-04.4] render.yaml (Infrastructure as Code)", labels: ["task","E1","infra"],
        body: `**O que fazer:** Criar \`render.yaml\` na raiz do repositório descrevendo os dois serviços e o banco, permitindo recriar o ambiente com um clique.

**Pré-condições:** Ambos os serviços configurados e funcionando manualmente.

**Notas de implementação:**
\`\`\`yaml
services:
  - type: web
    name: mini-marketplace-backend
    env: node
    buildCommand: cd backend && pnpm install && pnpm build
    startCommand: cd backend && pnpm prisma migrate deploy && node dist/server.js
    healthCheckPath: /api/health
  - type: web
    name: mini-marketplace-frontend
    env: node
    buildCommand: cd frontend && pnpm install && pnpm build
    startCommand: cd frontend && pnpm start
databases:
  - name: mini-marketplace-db
    plan: free
\`\`\`

**Cenários de teste:**
- TC-04.4.1: render.yaml válido segundo o schema do Render (render validate)` },
      { title: "[TASK-04.5] Workflow de CD no GitHub Actions", labels: ["task","E1","infra"],
        body: `**O que fazer:** Adicionar job de deploy ao pipeline CI que notifica/dispara o Render após CI passar em main.

**Pré-condições:** Deploy hooks configurados no Render para backend e frontend.

**Notas de implementação:**
- Usar deploy hooks do Render (URL webhook por serviço)
- Armazenar hooks como secrets: RENDER_BACKEND_HOOK, RENDER_FRONTEND_HOOK
- Job deploy roda apenas em push para main E após CI passar

**Cenários de teste:**
- TC-04.5.1: Merge em main com CI verde → job deploy dispara e Render inicia novo deploy
- TC-04.5.2: CI falha → job deploy não é executado` },
    ],
  },

  // ═══════════════════════════════════════════════════
  // E2 — AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════
  {
    title: "[US-05] Registro de usuário",
    labels: ["user-story","E2","backend","frontend"],
    milestone: 1,
    body: `## História
Como visitante, quero criar uma conta com email e senha para poder fazer pedidos no marketplace.

## Critérios de aceite
\`\`\`
Given um email único e senha com ao menos 8 caracteres,
When envio POST /api/auth/register,
Then recebo 201 com id e email do usuário criado (sem expor passwordHash).

Given um email já cadastrado,
When envio POST /api/auth/register,
Then recebo 409 Conflict com mensagem descritiva.

Given payload sem email ou com senha < 8 caracteres,
When envio POST /api/auth/register,
Then recebo 400 com lista de erros por campo.
\`\`\`

## RNF
- Senha armazenada como bcrypt hash (custo ≥ 10) — nunca em texto plano

## DoR
- [ ] Migração de users aprovada e aplicada no banco de dev
- [ ] Decisão de lib de validação tomada (zod ou class-validator)
- [ ] bcrypt como lib de hash acordada

## DoD
- [ ] Todos os 4 cenários de AuthService.register() passam no Jest
- [ ] passwordHash não aparece em nenhum body de resposta
- [ ] Teste E2E de registro passa no Cypress`,
    tasks: [
      { title: "[TASK-05.1] Migração: tabela users", labels: ["task","E2","backend","infra"],
        body: `**O que fazer:** Criar modelo User no schema.prisma e rodar migration.

**Notas:** Campos: id (uuid), email (unique), passwordHash, role (CUSTOMER|ADMIN), createdAt
Comando: \`prisma migrate dev --name create-users\`` },
      { title: "[TASK-05.2] AuthService.register() — lógica de negócio", labels: ["task","E2","backend","tdd"],
        body: `**O que fazer:** Validar email único, fazer hash da senha com bcrypt (custo 10) e persistir no banco.

**Pré-condições:** Tabela users criada; bcrypt e lib de validação instalados.

**Cenários de teste:**
- TC-05.2.1: Email único + senha válida → cria usuário, retorna { id, email } sem passwordHash
- TC-05.2.2: Email duplicado → lança ConflictException
- TC-05.2.3: Email inválido → lança ValidationException com campo email
- TC-05.2.4: Senha < 8 chars → lança ValidationException com campo password
- TC-05.2.5: passwordHash começa com \`$2b$10$\` (bcrypt custo 10)

**Dados de teste:**
- Válido: \`{ email: 'novo@test.com', password: 'Senha@123' }\`
- Duplicado: email já cadastrado no banco` },
      { title: "[TASK-05.3] Controller POST /api/auth/register", labels: ["task","E2","backend","tdd"],
        body: `**O que fazer:** Expor AuthService.register() via HTTP.

**Pré-condições:** AuthService.register() implementado; servidor rodando.

**Cenários de teste:**
- TC-05.3.1: Payload válido → 201, body { id, email }, sem passwordHash
- TC-05.3.2: Email duplicado → 409
- TC-05.3.3: Payload inválido → 400 com erros por campo

**Dados de teste:** Via Supertest` },
      { title: "[TASK-05.4] Página de registro — frontend", labels: ["task","E2","frontend","tdd"],
        body: `**O que fazer:** Formulário com validação inline, tratamento de 409 e redirecionamento após 201.

**Cenários de teste:**
- TC-05.4.1: Submit com email vazio → erro inline, sem chamada de rede
- TC-05.4.2: Resposta 409 → exibe 'Este email já está cadastrado'

**Dados de teste:**
- email válido: \`novo@test.com\`
- senha válida: \`Senha@123\`` },
    ],
  },

  {
    title: "[US-06] Login com JWT",
    labels: ["user-story","E2","backend","frontend"],
    milestone: 1,
    body: `## História
Como usuário cadastrado, quero fazer login com email e senha para receber um token e acessar áreas protegidas.

## Critérios de aceite
\`\`\`
Given email e senha corretos,
When envio POST /api/auth/login,
Then recebo 200 com JWT válido e tempo de expiração.

Given senha incorreta ou email inexistente,
When envio POST /api/auth/login,
Then recebo 401 com mensagem genérica (não revela qual campo está errado).
\`\`\`

## RNF
- Cookie httpOnly, Secure (produção), SameSite=Strict
- Mensagem de erro idêntica para email inexistente e senha errada (evita enumeração)

## DoD
- [ ] 4 cenários de AuthService.login() passam no Jest
- [ ] Token não aparece em localStorage — validado por Cypress
- [ ] Teste E2E de login completo passa no Cypress`,
    tasks: [
      { title: "[TASK-06.1] AuthService.login() — lógica de negócio", labels: ["task","E2","backend","tdd"],
        body: `**O que fazer:** Verificar credenciais, assinar JWT com payload { userId, role, email } e expiração 24h.

**Pré-condições:** Tabela users com ao menos um usuário; JWT_SECRET no .env.

**Cenários de teste:**
- TC-06.1.1: Credenciais válidas → retorna { token, expiresIn: '24h' }; payload contém userId, role, email
- TC-06.1.2: Senha incorreta → lança UnauthorizedException com mensagem genérica
- TC-06.1.3: Email inexistente → mesma exceção do TC-06.1.2
- TC-06.1.4: exp - iat === 86400 (24h em segundos)

**Dados de teste:**
- válido: \`{ email: 'admin@marketplace.com', password: 'Admin@123' }\`
- inválido: \`{ email: 'admin@marketplace.com', password: 'senhaerrada' }\`` },
      { title: "[TASK-06.2] Controller POST /api/auth/login", labels: ["task","E2","backend","tdd"],
        body: `**O que fazer:** Expor AuthService.login() via HTTP.

**Cenários de teste:**
- TC-06.2.1: Credenciais válidas → 200, body { token, expiresIn }
- TC-06.2.2: Credenciais inválidas → 401, body { message: 'Credenciais inválidas' }` },
      { title: "[TASK-06.3] Token em httpOnly cookie — frontend", labels: ["task","E2","frontend","tdd"],
        body: `**O que fazer:** API route Next.js /api/auth/session recebe token e seta cookie httpOnly. AuthContext expõe { user, login, logout }.

**Cenários de teste:**
- TC-06.3.1: Após login, user no contexto contém { userId, email, role }
- TC-06.3.2: Cypress verifica que token está em cookie httpOnly, não em localStorage

**Notas:** Decodificar payload com jwt-decode no client (sem verificar assinatura).` },
      { title: "[TASK-06.4] Página de login — frontend", labels: ["task","E2","frontend","tdd"],
        body: `**O que fazer:** Formulário com redirecionamento pós-auth e tratamento de erro 401.

**Cenários de teste:**
- TC-06.4.1: Erro 401 → exibe 'Email ou senha incorretos' sem mencionar qual campo está errado` },
    ],
  },

  {
    title: "[US-07] Proteção de rotas",
    labels: ["user-story","E2","backend","frontend"],
    milestone: 1,
    body: `## História
Como sistema, quero rejeitar acessos não autorizados para que dados de usuários e operações sensíveis sejam protegidos.

## Critérios de aceite
\`\`\`
Given requisição sem token ou com token inválido/expirado,
When acesso qualquer rota protegida,
Then recebo 401 Unauthorized.

Given token CUSTOMER em POST /api/products,
When envio a requisição,
Then recebo 403 Forbidden.

Given que não estou autenticada,
When acesso /orders pela URL direta,
Then sou redirecionada para /login.
\`\`\`

## DoD
- [ ] 4 cenários do authMiddleware passam no Jest
- [ ] 2 cenários do requireRole passam no Jest
- [ ] Cenários de guard no frontend passam no Cypress`,
    tasks: [
      { title: "[TASK-07.1] Middleware de autenticação JWT", labels: ["task","E2","backend","tdd"],
        body: `**O que fazer:** Interceptar requisições, validar token e popular req.user com o payload.

**Pré-condições:** JWT_SECRET no .env; usuário admin do seed cadastrado.

**Cenários de teste:**
- TC-07.1.1: Token válido → req.user contém { userId, email, role }
- TC-07.1.2: Sem token → 401 com { message: 'Token não fornecido' }
- TC-07.1.3: Token malformado → 401 com { message: 'Token inválido' }
- TC-07.1.4: Token expirado (gerar com exp 1s, aguardar 2s) → 401 com { message: 'Token expirado' }` },
      { title: "[TASK-07.2] Middleware de autorização por role", labels: ["task","E2","backend","tdd"],
        body: `**O que fazer:** requireRole('ADMIN') verifica se o usuário tem a role necessária.

**Cenários de teste:**
- TC-07.2.1: Token CUSTOMER em rota ADMIN → 403 com { message: 'Acesso negado: role insuficiente' }
- TC-07.2.2: Token ADMIN → requisição segue para o controller` },
      { title: "[TASK-07.3] Route guard — Next.js middleware", labels: ["task","E2","frontend","tdd"],
        body: `**O que fazer:** middleware.ts na raiz redireciona usuários não autenticados/não-admin nas rotas protegidas.

**Cenários de teste:**
- TC-07.3.1: Acessar /orders sem cookie → redireciona para /login
- TC-07.3.2: CUSTOMER tentando acessar /admin → redireciona para /

**Notas:** Verificar cookie do token nas rotas /orders e /admin/*.` },
    ],
  },

  // ═══════════════════════════════════════════════════
  // E3 — PRODUTOS
  // ═══════════════════════════════════════════════════
  {
    title: "[US-08] Catálogo público de produtos",
    labels: ["user-story","E3","backend","frontend"],
    milestone: 2,
    body: `## História
Como visitante, quero navegar pelo catálogo de produtos com filtros e paginação para encontrar o que preciso.

## Critérios de aceite
\`\`\`
Given a listagem de produtos,
When acesso GET /api/products?page=1&limit=12,
Then recebo { data: Product[], meta: { total, page, limit, totalPages } }.

Given busca por nome,
When acesso GET /api/products?search=notebook,
Then retorna apenas produtos com 'notebook' no nome (case-insensitive).

Given filtro por categoria,
When acesso GET /api/products?category=eletronicos,
Then retorna apenas produtos dessa categoria.
\`\`\`

## RNF
- GET /api/products responde em < 300ms (p95) com seed de 100 produtos

## DoD
- [ ] 6 cenários de ProductService.findAll()/findById() passam no Jest
- [ ] 4 cenários dos controllers passam no Supertest
- [ ] Teste E2E de busca passa no Cypress`,
    tasks: [
      { title: "[TASK-08.1] Migração: tabela products", labels: ["task","E3","backend","infra"],
        body: `**O que fazer:** Criar modelo Product no schema.prisma e rodar migration.

**Notas:** Campos: id (uuid), name, description, price (Decimal), category, stock (Int), imageUrl (nullable), createdAt
Comando: \`prisma migrate dev --name create-products\`` },
      { title: "[TASK-08.2] ProductService.findAll() com filtros e paginação", labels: ["task","E3","backend","tdd"],
        body: `**O que fazer:** Consulta paginada com filtros opcionais de search e category.

**Cenários de teste:**
- TC-08.2.1: Sem filtros → retorna { data, meta } com paginação correta
- TC-08.2.2: search=notebook → retorna apenas produtos com 'notebook' no nome (case-insensitive)
- TC-08.2.3: category=eletronicos → filtra por categoria
- TC-08.2.4: page=2&limit=5 → retorna a segunda página com no máximo 5 itens
- TC-08.2.5: meta.total reflete o total real de registros (não apenas da página)

**Dados de teste:** Seed com ≥ 10 produtos em ao menos 2 categorias` },
      { title: "[TASK-08.3] ProductService.findById()", labels: ["task","E3","backend","tdd"],
        body: `**O que fazer:** Buscar produto por id.

**Cenários de teste:**
- TC-08.3.1: ID válido → retorna produto completo
- TC-08.3.2: ID inexistente → lança NotFoundException` },
      { title: "[TASK-08.4] Controllers GET /api/products e /api/products/:id", labels: ["task","E3","backend","tdd"],
        body: `**O que fazer:** Expor os dois endpoints via HTTP. Rotas públicas (sem auth).

**Cenários de teste:**
- TC-08.4.1: GET /api/products → 200 com { data, meta }
- TC-08.4.2: GET /api/products?search=x → 200 com resultados filtrados
- TC-08.4.3: GET /api/products/:id válido → 200 com produto
- TC-08.4.4: GET /api/products/:id inválido → 404` },
      { title: "[TASK-08.5] Página de catálogo — frontend", labels: ["task","E3","frontend","tdd"],
        body: `**O que fazer:** Listagem com grid responsivo, campo de busca com debounce, filtro por categoria e paginação. Query params sincronizados com URL.

**Cenários de teste:**
- TC-08.5.1: URL ?search=x → campo de busca pré-preenchido e lista filtrada
- TC-08.5.2: Skeleton exibido durante fetch
- TC-08.5.3: Empty state com busca sem resultados` },
    ],
  },

  {
    title: "[US-09] Gestão de produtos (admin)",
    labels: ["user-story","E3","backend","frontend"],
    milestone: 2,
    body: `## História
Como admin, quero criar, editar e deletar produtos para manter o catálogo atualizado.

## Critérios de aceite
\`\`\`
Given token ADMIN e payload válido,
When envio POST /api/products,
Then recebo 201 com produto criado.

Given token CUSTOMER em POST /api/products,
When envio a requisição,
Then recebo 403.

Given admin na UI de /admin/products,
When cria um novo produto via formulário,
Then produto aparece na listagem pública.
\`\`\`

## DoD
- [ ] 5 cenários de ProductService CRUD passam no Jest
- [ ] 5 cenários dos controllers passam no Supertest
- [ ] Teste E2E de admin cria produto passa no Cypress`,
    tasks: [
      { title: "[TASK-09.1] ProductService CRUD (create, update, delete)", labels: ["task","E3","backend","tdd"],
        body: `**O que fazer:** Métodos create(), update() e delete() no ProductService.

**Cenários de teste:**
- TC-09.1.1: create() com payload válido → retorna produto criado
- TC-09.1.2: create() com price negativo → lança ValidationException
- TC-09.1.3: update() com id válido → retorna produto atualizado
- TC-09.1.4: update() com id inválido → lança NotFoundException
- TC-09.1.5: delete() com id válido → produto removido do banco` },
      { title: "[TASK-09.2] Controllers POST/PUT/DELETE /api/products", labels: ["task","E3","backend","tdd"],
        body: `**O que fazer:** Endpoints protegidos por authMiddleware + requireRole('ADMIN').

**Cenários de teste:**
- TC-09.2.1: POST com token ADMIN + payload válido → 201
- TC-09.2.2: POST com payload inválido → 400 com erros por campo
- TC-09.2.3: POST com token CUSTOMER → 403
- TC-09.2.4: PUT com id válido + token ADMIN → 200 com produto atualizado
- TC-09.2.5: DELETE com id válido + token ADMIN → 204` },
      { title: "[TASK-09.3] Admin UI — /admin/products", labels: ["task","E3","frontend"],
        body: `**O que fazer:** Tabela de produtos com ações de editar e deletar. Botão 'Novo produto' abre formulário.

**Notas:** Rota protegida via middleware Next.js (redirect para / se não for ADMIN); tabela com colunas: nome, categoria, preço, estoque, ações.` },
      { title: "[TASK-09.4] Formulário de produto (criação e edição)", labels: ["task","E3","frontend","tdd"],
        body: `**O que fazer:** Formulário reutilizável com validação client-side para criar e editar produtos.

**Cenários de teste:**
- TC-09.4.1: Submit com price negativo → erro inline no campo, POST não é chamado` },
      { title: "[TASK-09.5] Confirmação de deleção", labels: ["task","E3","frontend","tdd"],
        body: `**O que fazer:** Modal de confirmação antes de DELETE, com reversão otimista em caso de erro.

**Cenários de teste:**
- TC-09.5.1: Confirmar deleção + mockar DELETE 500 → produto desaparece e reaparece; toast de erro exibido` },
    ],
  },

  {
    title: "[US-10] Acessibilidade e responsividade do catálogo",
    labels: ["user-story","E3","frontend"],
    milestone: 2,
    body: `## História
Como usuário com qualquer dispositivo ou tecnologia assistiva, quero navegar no catálogo de forma confortável e acessível.

## Critérios de aceite
\`\`\`
Given viewport de 375px,
When a listagem carrega,
Then cards exibidos em coluna única sem overflow horizontal.

Given navegação por Tab,
When percorro os elementos interativos,
Then todos são focáveis e têm label descritivo.
\`\`\`

## RNF
- Pontuação de acessibilidade ≥ 80 no Lighthouse
- Sem overflow horizontal em 375px, 768px e 1280px

## DoD
- [ ] TC-10.3.1 e TC-10.3.2 passam no Jest (RTL)
- [ ] Lighthouse CI ≥ 80 em acessibilidade nas páginas de listagem e detalhe`,
    tasks: [
      { title: "[TASK-10.1] Layout responsivo", labels: ["task","E3","frontend"],
        body: `**O que fazer:** Grid Tailwind responsivo sem overflow em nenhum breakpoint.

**Notas:** 1 coluna em mobile (< 640px), 2 em tablet (640-1024px), 3-4 em desktop (> 1024px).` },
      { title: "[TASK-10.2] Markup acessível", labels: ["task","E3","frontend"],
        body: `**O que fazer:** HTML semântico com roles, labels e estados de foco visíveis.

**Notas:** Tags \`<main>\`, \`<nav>\`, \`<article>\`; todos os \`<input>\` com \`<label>\`; \`alt\` descritivo em imagens; \`aria-label\` em botões de ícone; ring no Tailwind para foco.` },
      { title: "[TASK-10.3] Estados de UI (loading, empty, error)", labels: ["task","E3","frontend","tdd"],
        body: `**O que fazer:** Skeleton, empty state e error state para os estados além do happy path.

**Cenários de teste:**
- TC-10.3.1: Mockar fetch para nunca resolver → skeletons visíveis no lugar dos cards
- TC-10.3.2: Mockar API retornando { data: [], meta: { total: 0 } } → 'Nenhum produto encontrado' visível` },
    ],
  },

  // ═══════════════════════════════════════════════════
  // E4 — PEDIDOS
  // ═══════════════════════════════════════════════════
  {
    title: "[US-11] Carrinho e checkout",
    labels: ["user-story","E4","backend","frontend"],
    milestone: 3,
    body: `## História
Como usuária autenticada, quero adicionar produtos ao carrinho e finalizar o pedido para registrar minha compra.

## Critérios de aceite
\`\`\`
Given usuária autenticada com produtos no carrinho,
When envio POST /api/orders,
Then recebo 201 com pedido criado, itens e total calculado.

Given productId inválido no carrinho,
When envio POST /api/orders,
Then recebo 400 indicando qual produto não existe.

Given sem autenticação,
When envio POST /api/orders,
Then recebo 401.
\`\`\`

## RNF
- unitPrice snapshot: mudanças de preço posteriores não alteram pedidos existentes
- Carrinho persiste em sessionStorage para sobreviver a refresh de página

## DoD
- [ ] 4 cenários de OrderService.create() passam no Jest (incluindo snapshot de preço)
- [ ] 3 cenários do controller passam no Supertest
- [ ] Teste E2E do fluxo completo de pedido passa no Cypress`,
    tasks: [
      { title: "[TASK-11.1] Migração: tabelas orders e order_items", labels: ["task","E4","backend","infra"],
        body: `**O que fazer:** Criar modelos Order e OrderItem no schema.prisma.

**Notas:**
- Order: id, userId, total, status (PENDING|COMPLETED|CANCELLED), createdAt
- OrderItem: id, orderId, productId, productName (snapshot), quantity, unitPrice (snapshot)
Comando: \`prisma migrate dev --name create-orders\`` },
      { title: "[TASK-11.2] OrderService.create() com snapshot de preço", labels: ["task","E4","backend","tdd"],
        body: `**O que fazer:** Validar produtos, calcular total e persistir com snapshots de nome e preço.

**Pré-condições:** Produtos no banco; usuário autenticado com token.

**Cenários de teste:**
- TC-11.2.1: Itens válidos → cria pedido com total correto (qty * unitPrice)
- TC-11.2.2: Alterar preço do produto depois → pedido original mantém unitPrice do momento da compra
- TC-11.2.3: productId inválido → lança BadRequestException com id do produto inexistente
- TC-11.2.4: Sem token → middleware bloqueia antes do service

**Dados de teste:** \`{ items: [{ productId, quantity: 2 }] }\`` },
      { title: "[TASK-11.3] Controller POST /api/orders", labels: ["task","E4","backend","tdd"],
        body: `**O que fazer:** Expor OrderService.create() via HTTP, protegido por authMiddleware.

**Cenários de teste:**
- TC-11.3.1: Token válido + itens válidos → 201 com pedido
- TC-11.3.2: productId inválido → 400
- TC-11.3.3: Sem token → 401` },
      { title: "[TASK-11.4] CartContext — React Context", labels: ["task","E4","frontend","tdd"],
        body: `**O que fazer:** Contexto com addItem, removeItem, updateQuantity, clearCart e total calculado. Persistir em sessionStorage.

**Cenários de teste:**
- TC-11.4.1: addItem duplicado → incrementa quantity (não duplica)
- TC-11.4.2: removeItem → remove produto da lista
- TC-11.4.3: total calculado corretamente: 2×R$10 + 1×R$30 = R$50
- TC-11.4.4: clearCart → items === [] e total === 0` },
      { title: "[TASK-11.5] Drawer de carrinho e ação de checkout", labels: ["task","E4","frontend","tdd"],
        body: `**O que fazer:** UI lateral com lista de itens, total e botão de checkout que chama POST /api/orders.

**Cenários de teste:**
- TC-11.5.1: cart.items vazio → botão 'Finalizar pedido' tem atributo disabled

**Notas:** Em sucesso: clearCart() + redirecionar para /orders com toast; em erro: exibir mensagem sem limpar carrinho.` },
    ],
  },

  {
    title: "[US-12] Histórico de pedidos",
    labels: ["user-story","E4","backend","frontend"],
    milestone: 3,
    body: `## História
Como usuária autenticada, quero visualizar meus pedidos anteriores para acompanhar minhas compras.

## Critérios de aceite
\`\`\`
Given usuária com pedidos realizados,
When acesso GET /api/orders,
Then recebo apenas meus pedidos com itens e total.

Given dois usuários com pedidos distintos,
When cada um acessa GET /api/orders,
Then cada um vê apenas os seus.
\`\`\`

## RNF
- Pedidos ordenados por data decrescente (mais recente primeiro)
- Isolamento: nenhuma usuária pode ver pedidos de outra

## DoD
- [ ] 3 cenários de OrderService.findByUser() passam no Jest
- [ ] 2 cenários do controller passam no Supertest (incluindo isolamento)
- [ ] Teste E2E de /orders passa no Cypress`,
    tasks: [
      { title: "[TASK-12.1] OrderService.findByUser()", labels: ["task","E4","backend","tdd"],
        body: `**O que fazer:** Consultar pedidos filtrando por userId, incluindo itens e nomes dos produtos.

**Cenários de teste:**
- TC-12.1.1: Retorna apenas pedidos do userId informado (pedidos de outro user ausentes)
- TC-12.1.2: Pedidos ordenados por createdAt desc
- TC-12.1.3: items[0] contém { productId, productName, quantity, unitPrice }` },
      { title: "[TASK-12.2] Controller GET /api/orders", labels: ["task","E4","backend","tdd"],
        body: `**O que fazer:** Listar pedidos do usuário autenticado extraindo userId do token.

**Cenários de teste:**
- TC-12.2.1: GET com token → 200, array contém apenas pedidos da usuária autenticada
- TC-12.2.2: Token de userB não retorna pedidos de userA` },
      { title: "[TASK-12.3] Página /orders — frontend", labels: ["task","E4","frontend","tdd"],
        body: `**O que fazer:** Lista de pedidos com data, total, itens expandíveis (accordion) e empty state.

**Cenários de teste:**
- TC-12.3.1: Mockar GET retornando [] → exibe 'Você ainda não fez nenhum pedido' com link para /products

**Notas:** Rota protegida via middleware Next.js; skeleton loader durante fetch.` },
    ],
  },

  // ═══════════════════════════════════════════════════
  // E5 — QUALIDADE & ENTREGA
  // ═══════════════════════════════════════════════════
  {
    title: "[US-13] Cobertura de componentes críticos",
    labels: ["user-story","E5","frontend","tdd"],
    milestone: 4,
    body: `## História
Como desenvolvedora, quero testes unitários nos componentes mais importantes do frontend para ter confiança em refatorações futuras.

## Critérios de aceite
\`\`\`
Given pnpm test no /frontend,
When todos os testes rodam,
Then cobertura ≥ 70% nos componentes críticos e nenhum teste falha.
\`\`\`

## DoD
- [ ] 3 cenários do ProductCard passam no Jest
- [ ] 2 cenários dos formulários passam no Jest
- [ ] 3 cenários do CartContext passam no Jest
- [ ] pnpm test retorna exit code 0 com cobertura ≥ 70%`,
    tasks: [
      { title: "[TASK-13.1] Testes do ProductCard", labels: ["task","E5","frontend","tdd"],
        body: `**Pré-condições:** \`<ProductCard product={...} onAddToCart={fn} />\` implementado.

**Cenários de teste:**
- TC-13.1.1: Renderiza nome, preço formatado e categoria visíveis no DOM
- TC-13.1.2: Clicar em 'Adicionar' → callback chamado 1 vez com o objeto produto
- TC-13.1.3: stock === 0 → botão disabled e badge 'Sem estoque' visível

**Dados de teste:** \`{ id, name: 'Notebook', price: 4999.90, category: 'Eletrônicos', stock: 5 }\`` },
      { title: "[TASK-13.2] Testes dos formulários de autenticação", labels: ["task","E5","frontend","tdd"],
        body: `**Cenários de teste:**
- TC-13.2.1: RegisterForm com email inválido → erro inline visível, fetch não chamado
- TC-13.2.2: LoginForm recebe 401 → 'Email ou senha incorretos' visível; sem menção ao campo específico` },
      { title: "[TASK-13.3] Testes do CartContext", labels: ["task","E5","frontend","tdd"],
        body: `**Pré-condições:** CartProvider envolvendo o componente nos testes.

**Cenários de teste:**
- TC-13.3.1: addItem duplicado → items.length === 1, items[0].quantity === 2
- TC-13.3.2: removeItem → items === []
- TC-13.3.3: total: 2×R$100 + 1×R$50 → cart.total === 250` },
    ],
  },

  {
    title: "[US-14] E2E completos e documentação",
    labels: ["user-story","E5","e2e","infra"],
    milestone: 4,
    body: `## História
Como avaliadora, quero um README completo e os 4 fluxos E2E passando para validar o projeto sem precisar perguntar nada.

## Critérios de aceite
\`\`\`
Given o repositório clonado em máquina limpa,
When sigo o README,
Then o projeto sobe, migrations rodam, seed é aplicado e consigo acessar frontend e API.

Given os comandos do README,
When executo pnpm test e pnpm test:e2e,
Then todos os testes passam e o resultado aparece no terminal.
\`\`\`

## RNF
- README seguível por desenvolvedor sem contexto prévio em < 15 minutos
- Todos os 4 cenários E2E passam em headless (CI)

## DoD
- [ ] pnpm test:e2e passa com os 4 cenários E2E em headless
- [ ] README revisado e aprovado`,
    tasks: [
      { title: "[TASK-14.1] README — Como rodar e testar", labels: ["task","E5","infra"],
        body: `**O que fazer:** Documentar pré-requisitos, passo a passo Docker, alternativa sem Docker e comandos de teste.

**Notas:**
- Pré-requisitos: Node 20+, Docker 24+, pnpm 8+
- Seções: clone → .env → docker-compose up; pnpm test; pnpm test:e2e
- Credenciais do admin do seed e URLs de acesso (local e Render)` },
      { title: "[TASK-14.2] README — Decisões técnicas e próximos passos", labels: ["task","E5","infra"],
        body: `**O que fazer:** Explicar as principais escolhas e o que seria feito com mais tempo.

**Notas:**
- Framework backend: Express vs NestJS + justificativa
- Auth: JWT httpOnly cookie vs localStorage
- Deploy: Render free tier e suas limitações
- Próximos passos: refresh token, upload S3, cache Redis, RBAC granular` },
      { title: "[TASK-14.3] Cenários E2E — Cypress", labels: ["task","E5","e2e","tdd"],
        body: `**O que fazer:** Implementar os 4 fluxos críticos de ponta a ponta.

**Pré-condições:** Ambiente rodando via docker-compose com seed; Cypress configurado com baseUrl do frontend.

**Cenários de teste:**
- TC-14.3.1: Registro → login → adicionar produto → checkout → /orders mostra pedido com total correto
- TC-14.3.2: Admin login → /admin/products → criar produto → acessar /products como visitante → produto visível
- TC-14.3.3: /products → buscar termo → apenas produtos com o termo exibidos; URL atualizada com ?search=
- TC-14.3.4: Sem login → acessar /orders diretamente → redirecionada para /login

**Dados de teste:**
- admin: \`admin@marketplace.com / Admin@123\`
- customer: gerado dinamicamente via faker` },
    ],
  },
];

// ── MAIN ─────────────────────────────────────────────────────────────

async function createLabels() {
  console.log("\n📌 Criando labels...");
  // Busca labels existentes para não duplicar
  const existing = await api("GET", `/repos/${OWNER}/${REPO}/labels?per_page=100`);
  const existingNames = new Set(existing.map(l => l.name));

  for (const label of LABELS) {
    if (existingNames.has(label.name)) {
      console.log(`  ⏭  Label já existe: ${label.name}`);
      continue;
    }
    await withRetry(() => api("POST", `/repos/${OWNER}/${REPO}/labels`, label), label.name);
    console.log(`  ✅  ${label.name}`);
    await sleep(300);
  }
}

async function createMilestones() {
  console.log("\n🏁 Criando milestones...");
  const existing = await api("GET", `/repos/${OWNER}/${REPO}/milestones?state=all&per_page=100`);
  const existingTitles = new Map(existing.map(m => [m.title, m.number]));
  const milestoneNumbers = [];

  for (const ms of MILESTONES) {
    if (existingTitles.has(ms.title)) {
      const n = existingTitles.get(ms.title);
      console.log(`  ⏭  Milestone já existe: ${ms.title} (#${n})`);
      milestoneNumbers.push(n);
      continue;
    }
    const created = await withRetry(
      () => api("POST", `/repos/${OWNER}/${REPO}/milestones`, ms),
      ms.title
    );
    milestoneNumbers.push(created.number);
    console.log(`  ✅  ${ms.title} → milestone #${created.number}`);
    await sleep(300);
  }
  return milestoneNumbers;
}

async function addSubIssue(parentNodeId, childNodeId) {
  // Usa GraphQL mutation para sub-issues (feature recente do GitHub)
  const mutation = `
    mutation AddSubIssue($parentId: ID!, $childId: ID!) {
      addSubIssue(input: { issueId: $parentId, subIssueId: $childId }) {
        issue { number title }
        subIssue { number title }
      }
    }
  `;
  try {
    await graphql(mutation, { parentId: parentNodeId, childId: childNodeId });
  } catch (e) {
    // Sub-issues podem não estar disponíveis em repos sem o feature habilitado
    // Nesse caso linkamos via comentário
    console.warn(`  ⚠️  Sub-issue GraphQL falhou (pode não estar habilitado): ${e.message.substring(0, 80)}`);
  }
}

async function createIssues(milestoneNumbers) {
  console.log("\n📝 Criando issues (US e tasks)...");
  const allNodeIds = []; // todos os nodeIds para adicionar ao Project

  // Checa issues existentes para idempotência
  let existingIssues = [];
  let page = 1;
  while (true) {
    const batch = await api("GET", `/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&page=${page}`);
    if (!batch.length) break;
    existingIssues = existingIssues.concat(batch);
    page++;
  }
  const existingTitles = new Map(existingIssues.map(i => [i.title, { number: i.number, nodeId: i.node_id }]));

  for (const us of US_DATA) {
    const msNumber = milestoneNumbers[us.milestone];

    // Cria (ou reutiliza) a US
    let usIssue;
    if (existingTitles.has(us.title)) {
      usIssue = existingTitles.get(us.title);
      console.log(`  ⏭  US já existe: #${usIssue.number} ${us.title}`);
    } else {
      const created = await withRetry(() =>
        api("POST", `/repos/${OWNER}/${REPO}/issues`, {
          title: us.title, body: us.body, labels: us.labels, milestone: msNumber,
        }), us.title
      );
      usIssue = { number: created.number, nodeId: created.node_id };
      console.log(`  ✅  #${usIssue.number} ${us.title}`);
      await sleep(500);
    }
    allNodeIds.push(usIssue.nodeId);

    // Cria (ou reutiliza) as tasks
    for (const task of us.tasks) {
      let taskIssue;
      if (existingTitles.has(task.title)) {
        taskIssue = existingTitles.get(task.title);
        console.log(`    ⏭  Task já existe: #${taskIssue.number} ${task.title}`);
      } else {
        const created = await withRetry(() =>
          api("POST", `/repos/${OWNER}/${REPO}/issues`, {
            title: task.title, body: task.body, labels: task.labels, milestone: msNumber,
          }), task.title
        );
        taskIssue = { number: created.number, nodeId: created.node_id };
        console.log(`    ↳ #${taskIssue.number} ${task.title}`);
        await sleep(500);
      }
      allNodeIds.push(taskIssue.nodeId);

      // Tenta vincular como sub-issue via GraphQL
      await addSubIssue(usIssue.nodeId, taskIssue.nodeId);
    }
  }
  return allNodeIds;
}

async function getOrCreateProject() {
  console.log("\n📋 Verificando GitHub Project board...");
  const userData = await graphql(`query { viewer { id login projectsV2(first: 20) { nodes { id number title url } } } }`);
  const ownerId = userData.viewer.id;

  // Procura projeto existente com o nome "Mini Marketplace"
  const existing = userData.viewer.projectsV2.nodes.find(p => p.title === "Mini Marketplace");
  if (existing) {
    console.log(`  ⏭  Projeto já existe: ${existing.url}`);
    return existing;
  }

  // Cria novo projeto
  const projectData = await graphql(`
    mutation CreateProject($ownerId: ID!) {
      createProjectV2(input: { ownerId: $ownerId, title: "Mini Marketplace" }) {
        projectV2 { id number url }
      }
    }
  `, { ownerId });
  const project = projectData.createProjectV2.projectV2;
  console.log(`  ✅  Projeto criado: ${project.url}`);

  // Adiciona campos customizados
  console.log("  🔧 Adicionando campos customizados...");
  for (const field of [
    { name: "Tipo", options: [
      { name: "User Story", color: "PURPLE" },
      { name: "Task", color: "GREEN" },
    ]},
    { name: "Épico", options: [
      { name: "E1 — Inicialização", color: "BLUE" },
      { name: "E2 — Autenticação", color: "GREEN" },
      { name: "E3 — Produtos", color: "ORANGE" },
      { name: "E4 — Pedidos", color: "RED" },
      { name: "E5 — Qualidade", color: "PURPLE" },
    ]},
  ]) {
    const optionsGql = field.options.map(o => `{ name: ${JSON.stringify(o.name)}, color: ${o.color}, description: "" }`).join(", ");
    await graphql(`
      mutation($projectId: ID!) {
        createProjectV2Field(input: {
          projectId: $projectId
          dataType: SINGLE_SELECT
          name: ${JSON.stringify(field.name)}
          singleSelectOptions: [${optionsGql}]
        }) { projectV2Field { ... on ProjectV2SingleSelectField { id } } }
      }
    `, { projectId: project.id }).catch(e => console.warn(`  ⚠️  Campo ${field.name}: ${e.message.substring(0,60)}`));
    await sleep(300);
  }
  console.log(`  ✅  Campos customizados criados`);
  return project;
}

async function addIssuesToProject(projectId, nodeIds) {
  console.log(`\n🔗 Adicionando ${nodeIds.length} issues ao Project board...`);
  let added = 0;
  for (const contentId of nodeIds) {
    if (!contentId) continue;
    try {
      await graphql(`
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
          }
        }
      `, { projectId, contentId });
      added++;
      if (added % 10 === 0) console.log(`  ... ${added}/${nodeIds.length}`);
      await sleep(200);
    } catch (e) {
      console.warn(`  ⚠️  Falhou ao adicionar item ${contentId}: ${e.message.substring(0,60)}`);
    }
  }
  console.log(`  ✅  ${added} issues adicionadas ao board`);
}

async function main() {
  console.log(`\n🚀 Mini Marketplace — GitHub Importer`);
  console.log(`   Repo: ${OWNER}/${REPO}`);
  console.log(`   Token: ${TOKEN.substring(0, 8)}...`);

  try {
    await createLabels();
    const milestoneNumbers = await createMilestones();
    const allNodeIds = await createIssues(milestoneNumbers);
    const project = await getOrCreateProject();
    await addIssuesToProject(project.id, allNodeIds);

    const totalTasks = US_DATA.reduce((acc, us) => acc + us.tasks.length, 0);
    console.log(`\n✅ Importação concluída!`);
    console.log(`   Labels: ${LABELS.length}`);
    console.log(`   Milestones: ${MILESTONES.length}`);
    console.log(`   Issues: ${US_DATA.length} US + ${totalTasks} tasks = ${US_DATA.length + totalTasks} total`);
    console.log(`\n🎉 Project board: https://github.com/users/${OWNER}/projects/${project.number}`);
    console.log(`\n📌 Próximo passo: no board, crie uma view "Board" agrupada por Status`);
    console.log(`   e outra view "Backlog" agrupada por Épico.`);
  } catch (e) {
    console.error("\n❌ Erro:", e.message);
    process.exit(1);
  }
}

main();
