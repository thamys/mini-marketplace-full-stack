# Implementation Plan - Estratégia de Testes E2E Full Stack

Este documento define a abordagem unificada para testes end-to-end (E2E) do projeto, abrangendo o frontend e o backend sem onerar ou poluir o ambiente local com excesso de contêineres Docker avulsos.

A filosofia guia aqui é "testes independentes e focados no CI", preservando a infraestrutura que o projeto já entrega (serviços temporários via GitHub Actions para o DB).

## User Review Required

> [!NOTE]
> Os arquivos `Dockerfile` existentes continuarão ilesos para builds de homologação/produção, mas **não** serão utilizados como dependência estrita para rodar as suítes de teste (agilizando a verificação E2E local ou na CI).

## Proposed Changes

### Parte 1: Inclusão do Backend E2E na CI (GitHub Actions)

A infraestrutura `.github/workflows/ci.yml` já sobe perfeitamente o banco de dados via "GitHub Actions Services" (postgres:15-alpine). Os dados criados são limpos automaticamente com a morte do runner.

#### [MODIFY] `.github/workflows/ci.yml`

- Inserir a instrução `pnpm run test:e2e` logo após (ou em paralelo) à suíte unitária `test:cov`.
- Como o banco recém-iniciado e "migrado" (`migrate deploy`) na CI estará com as tabelas limpas, não necessitamos de envs de mock. O E2E do NestJS rodará liso consumindo a porta `5432` provida pelo postgres container do CI.

### Parte 2: Setup do E2E Frontend (Playwright)

O frontend deve ser testado isoladamente a nível de UI, interceptando o tráfego HTTP para não dependender do backend e do banco de dados na maioria dos casos E2E comuns, agilizando drasticamente os _checks_.

#### [NEW] `frontend/playwright.config.ts`

- Inicialização do Playwright e definição da porta de desenvolvimento do Next.js.
- Configurar base URL e suporte a todos os navegadores modernos no CI.

#### [MODIFY] `frontend/package.json`

- Adicionar comando: `"test:e2e": "playwright test"`
- Adicionar sub-comando para inspecionar localmente: `"test:e2e:ui": "playwright test --ui"`

### Parte 3: Desenvolvimento do Frontend Spec (Registro)

#### [NEW] `frontend/e2e/register.spec.ts`

Desenvolver os cenários cruciais para o form de registro que desenhamos recentemente com o Shadcn e Zod:

1. **Successful Registration (Mocked backend):**
   - Rota interceptada pelo Playwright (`POST /api/auth/register`) forçando retorno de Status `201`.
   - Form preenchido com dados _happy path_.
   - **Assert:** Toast de "Cadastro realizado com sucesso!" disparou e router redirecionou de volta a Home/Login.

2. **Backend Error Treatment (Email 409 Conflict):**
   - Interceptação com injeção de falha `HTTP 409 Conflict`.
   - **Assert:** O aviso de erro de e-mail duplicado brota anexado em baixo do controle do formulário de email (validador integrado react-hook-form usando as tipagens construídas hoje).

3. **Frontend Validation (Zod errors):**
   - Ação manual de submeter branco ou falhar na complexidade de senha/email.
   - **Assert:** API interceptor não é chamada; Avisos de texto pipocam inline usando o suporte de validação _Zod-resolver_.

## Verification Plan

### Testando Localmente

1. **Frontend**: Executar `pnpm -C frontend run test:e2e:ui` para verificar o robô do Chromium realizando o preenchimento de inputs com sucesso sobre uma instância limpa de Next.js.
2. **Backend**: Executar os E2E sujos caso desejado sabendo da consequência do Seed. Contudo, confiamos que o CI isolará os dados.

### Testando na CI

1. O processo de GHA será engatilhado no Push.
2. Constatar, nos logs do repositório, que o job `test-backend` completará finalizando o array de execuções com a frase Jest E2E test Suite **PASS**.
