# Mock Interview

Este documento visa simular perguntas técnicas frequentes feitas por recrutadores e engenheiros sêniores, baseadas na implementação deste "Mini Marketplace", listando as devidas respostas e justificativas.

---

### Q1: Por que você escolheu estruturar esse projeto como um Monorepo usando `pnpm` workspaces?
**R:** A escolha do monorepo traz como vantagem manter todo o código que representa um único produto no mesmo repositório. O uso do `pnpm` workspaces otimiza isso por que ele faz o hoisting inteligente de dependências (`node_modules` unificado e por meio de symlinks na raiz). Assim, ganhamos rapidez na instalação e economizamos espaço em disco, enquanto frontend e backend podem, em evolução futura, compartilhar pacotes comuns, como tipos e interfaces do TypeScript (`packages/shared`), mitigando problemas de tipagem entre cliente e servidor.

### Q2: A aplicação utiliza o App Router do Next.js. O que motivou essa escolha em comparação ao Page Router tradicional ou a um Single Page Application (SPA) comum (ex: Vite)?
**R:** A necessidade de entregar tanto um e-commerce amigável para SEO como uma aplicação interativa (carrinho, filtros, painel admin). O *App Router* permite misturar Server Components (RSCs) e Client Components de forma nativa. Podemos renderizar a lista de produtos no servidor para entregar HTML pronto rápido aos rastreadores do Google, reduzindo o bundle de JavaScript ao redor da página principal. Em áreas como o painel de administrador, ou para estados de UI complexos do carrinho, utilizamos componentes de cliente com hooks como `useState` ou `useContext`.

### Q3: Em relação ao Backend com NestJS: você acha que esse framework é complexo demais para uma API de um projeto pequeno?
**R:** O NestJS introduz sim uma curva inicial de aprendizado devido à sua abordagem opinativa – uso massivo de decorators, Inversão de Controle (IoC) e módulos arquiteturais. Contudo, em "take homes" com viés de simular um ambiente *production-ready*, o NestJS é a escolha mais apropriada porque obriga o projeto a nascer bem estratificado e estruturado (Controllers para roteamento HTTP, Services para a regra de negócio e Modules para a orquestração), prevenindo código "solto" e espaguete à medida que o e-commerce escala. Adicionalmente, seu ecossistema possui integração excelente com o Prisma (*PrismaService* injetável) e classes utilitárias embutidas (Pipes para *validation*, Guards para autorização de Admin).

### Q4: Poderia comentar sobre como a autenticação e permissões foram implementadas?
**R:** A autorização baseia-se em *JSON Web Tokens* (JWT) fornecidos no login. A segurança do tráfego seria idealmente coberta por *HTTPS/SSL* e os JWTs idealmente seriam armazenados em cookies `httpOnly` para evitar que scripts maliciosos atuem com ataques XSS pegando o token do `localStorage`. 
A mecânica de Role-Based Access Control (RBAC) está implementada mapeando um enum `Role` (Customer | Admin) no modelo de usuário do banco. Nas rotas protegidas por Guards (`@UseGuards(JwtAuthGuard, RolesGuard)` no NestJS), validamos a permissão antes sequer de instanciar a classe controladora, isolando a regra de segurança da lógica de negócios.

### Q5: Quais trade-offs conscientes você tomou na construção deste projeto devido ao prazo/escopo, e o que você alteraria em caso de escala real?
**R:** Como é um projeto compacto com o viés estrito de teste técnico, há quatro tradeoffs principais que merecem citação:
1. **Ausência de Integração de Pagamento:** Evitei acoplar um gateway comercial como Stripe. O objetivo precípuo deste assessment é testar minha destreza técnica em arquitetar o core da aplicação (Next.js, NestJS, Prisma) e não puramente consumir APIs de terceiros. A finalização do carrinho no momento apenas simula a aprovação prévia criando a `Order` no banco.
2. **Carrinho local vs. Carrinho no Banco:** Para otimizar prazo, lidamos com o estado de carrinho de compras exclusivamente na camada do front (via Contexto e LocalStorage) empurrando a informação pro DB somente no Checkout (criação da `Order`). Isso poupa requisições à API, mas peca na consistência cross-device.
3. **Paginação em Memória ou Banco Relacional Básico vs. Search Engines:** A busca via `category` e `name substring` é performática na camada do banco até certo ponto via ILIKE. Se o catálogo passar de 1 milhão de produtos, eu o substituiria por um *Elasticsearch* ou *Meilisearch*.
4. **Ausência de Assincronia para Processamento:** Não houve implementação de mensageria (ex: RabbitMQ ou Redis para gerenciar transações) para processamento da compra – do jeito atual, criar o pedido é feito atomicamente no request/response do HTTP, o que numa carga alta de Black Friday traria riscos de timeout.

### Q6: Falando na Black Friday. Quais melhorias você introduziria para garantir alta disponibilidade no momento em que o tráfego dar um pico de 100x o normal?
**R:**
- **Cache Local das Listas de Produtos:** Semelhante a usar o cache nativo do Next (Data cache) com ISR (Incremental Static Regeneration) ou no Backend instalar uma camada de Redis interceptora, já que 99% será de operações de LEITURA de produtos e 1% de ESCRITA.
- **Índices de Banco:** Criar índices nas FKs do banco, nas colunas de busca (nome do produto, id e status das orders) no PostgreSQL.
- **Rate-limitting e CDN:** Distribuir o provisionamento dos ativos do Frontend e usar serviços como Cloudflare, blindando a API de tráfego exaustivo malicioso que consome as threads do Node.js.
