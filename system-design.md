# System Design: Mini Marketplace Full-Stack

Este documento apresenta a arquitetura e componentes da aplicação através de diagramas estilo C4 e ERD, usando notação Mermaid.

## 1. High-Level Architecture (Context Diagram)

```mermaid
C4Context
    title Componentes de Alto Nível: Mini Marketplace

    Person(customer, "Cliente", "Navega pelos produtos, adiciona ao carrinho e realiza pedidos.")
    Person(admin, "Administrador", "Gerencia os produtos e acompanha as métricas de vendas.")
    
    System_Boundary(marketplace, "Mini Marketplace System") {
        System(frontend, "Frontend App", "Next.js + Tailwind CSS. Interface do usuário responsiva e SSR.")
        System(backend, "Backend API", "NestJS App. Provê a lógica de negócios e as rotas RESTful.")
        SystemDb(database, "PostgreSQL", "Banco de dados relacional contendo os produtos, usuários e pedidos.")
    }

    Rel(customer, frontend, "Interage com (Navegador/Mobile)", "HTTPS")
    Rel(admin, frontend, "Interage com o painel de adm", "HTTPS")
    
    Rel(frontend, backend, "Consome APIs JSON / Autenticação JWT", "REST")
    Rel(backend, database, "Lê/Escreve dados via ORM", "Prisma/TCP")
```

## 2. Container Diagram (Backend)

```mermaid
C4Container
    title Estrutura de Contêineres - Backend (NestJS)

    Container(api, "API Gateway / Controllers", "NestJS", "Recebe requisições REST HTTP do Frontend")
    
    Boundary(modules, "Módulos de Negócio") {
        Container(auth, "Auth Module", "JWT", "Lida com login, registro e verificação de tokens")
        Container(products, "Products Module", "NestJS Services", "Lida com listagem, busca, edição e deleção de produtos")
        Container(orders, "Orders Module", "NestJS Services", "Cria pedidos e busca histórico do usuário cruzando carrinho e DB")
    }

    Container(prisma, "Prisma ORM", "TypeScript", "Camada de abstração e query builder conectada ao banco")

    Rel(api, auth, "Delega")
    Rel(api, products, "Delega")
    Rel(api, orders, "Delega")
    
    Rel(auth, prisma, "Valida e salva Credenciais")
    Rel(products, prisma, "CRUD e Queries")
    Rel(orders, prisma, "Registra compras")
```

## 3. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User {
        String id PK
        String email
        String name
        String passwordHash
        Role role
        DateTime createdAt
        DateTime updatedAt
    }

    Product {
        String id PK
        String name
        String description
        Decimal price
        String category
        Int stock
        String imageUrl
        DateTime createdAt
    }

    Order {
        String id PK
        String userId FK
        Decimal total
        OrderStatus status
        DateTime createdAt
    }

    OrderItem {
        String id PK
        String orderId FK
        String productId FK
        String productName
        Int quantity
        Decimal unitPrice
    }

    User ||--o{ Order : "places"
    Order ||--|{ OrderItem : "contains"
    Product ||--o{ OrderItem : "is part of"
```

## 4. Fluxo de Autenticação (Sequence Diagram)

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as Frontend (Next.js)
    participant B as Backend (NestJS)
    participant DB as Banco de Dados

    U->>F: Insere Email e Senha (Login)
    F->>B: POST /api/auth/login
    B->>DB: Busca User por Email
    DB-->>B: Retorna User + Hash
    B->>B: Valida Senha (bcrypt)
    B-->>F: Retorna Token JWT (Cookie httpOnly ou payload)
    F->>F: Salva Sessão (Context / Zustand)
    F-->>U: Redireciona para Dashboard/Home
```
