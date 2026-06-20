# 📊 Controle de Estoque - Documentação Completa

## 🎯 Visão Geral

Sistema profissional de **Controle de Estoque** com:
- ✅ Autenticação JWT
- ✅ CRUD Completo de Produtos
- ✅ Gestão de Fornecedores
- ✅ Pedidos de Compra
- ✅ Movimentações de Estoque
- ✅ Avisos de Vencimento
- ✅ Dashboard e Relatórios
- ✅ Notificações em Tempo Real
- ✅ Fila de Emails com Retry
- ✅ Auditoria Completa

---

## 🚀 Setup Inicial

### 1. Clonar Repositório
```bash
git clone https://github.com/gleisons21/controle-estok.git
cd controle-estok
```

### 2. Instalar Dependências
```bash
cd backend
npm install
```

### 3. Configurar Banco de Dados

```bash
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE controle_estoque;"

# Executar schemas
psql -U postgres -d controle_estoque < ../database/schema.sql
psql -U postgres -d controle_estoque < ../database/schema-autenticacao.sql
psql -U postgres -d controle_estoque < ../database/schema-vencimento.sql
psql -U postgres -d controle_estoque < ../database/schema-fila-emails.sql
psql -U postgres -d controle_estoque < ../database/schema-fornecedores-pedidos.sql
psql -U postgres -d controle_estoque < ../database/schema-sistema.sql
```

### 4. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 5. Executar

```bash
npm run dev
```

---

## 🔐 Autenticação

### Registrar
```http
POST /api/auth/registrar
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha123",
  "papel": "admin"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "token": "eyJhbGc...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "papel": "admin"
  }
}
```

---

## 📦 Produtos

### Criar
```http
POST /api/produtos
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "nome": "Notebook Dell",
  "sku": "DELL-XPS-15",
  "categoria_id": 1,
  "preco_custo": 3000,
  "preco_venda": 4500,
  "quantidade_minima": 5
}
```

### Listar
```http
GET /api/produtos?pagina=1&limite=20
Authorization: Bearer TOKEN
```

### Buscar por ID
```http
GET /api/produtos/1
Authorization: Bearer TOKEN
```

### Editar
```http
PUT /api/produtos/1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "preco_venda": 4800
}
```

### Deletar
```http
DELETE /api/produtos/1
Authorization: Bearer TOKEN
```

---

## 🏭 Fornecedores

### Criar
```http
POST /api/fornecedores
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "nome": "Fornecedor XYZ",
  "email": "contato@fornecedor.com",
  "telefone": "(11) 99999-9999",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

### Listar
```http
GET /api/fornecedores
Authorization: Bearer TOKEN
```

---

## 📋 Pedidos

### Criar
```http
POST /api/pedidos
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "fornecedor_id": 1,
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 10,
      "preco_unitario": 3000
    }
  ],
  "observacoes": "Entrega urgente"
}
```

### Listar
```http
GET /api/pedidos?status=pendente
Authorization: Bearer TOKEN
```

### Atualizar Status
```http
PUT /api/pedidos/1/status
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "entregue"
}
```

---

## 📊 Dashboard e Relatórios

### Dashboard
```http
GET /api/relatorios/dashboard
Authorization: Bearer TOKEN
```

**Retorna:**
- Total de produtos
- Total em estoque
- Produtos com estoque baixo
- Movimentações do mês
- Top 5 produtos
- Produtos próximos a vencer
- Pedidos pendentes

### Relatório de Estoque
```http
GET /api/relatorios/relatorio/estoque
Authorization: Bearer TOKEN
```

### Relatório de Vendas
```http
GET /api/relatorios/relatorio/vendas
Authorization: Bearer TOKEN
```

### Relatório de Fornecedores
```http
GET /api/relatorios/relatorio/fornecedores
Authorization: Bearer TOKEN
```

---

## 🔔 Notificações

### Listar
```http
GET /api/notificacoes
Authorization: Bearer TOKEN
```

### Marcar como Lida
```http
PUT /api/notificacoes/1/marcar-lida
Authorization: Bearer TOKEN
```

### Deletar
```http
DELETE /api/notificacoes/1
Authorization: Bearer TOKEN
```

---

## ⚙️ Configurações

### Listar (Admin)
```http
GET /api/configuracoes
Authorization: Bearer TOKEN
```

### Atualizar (Admin)
```http
PUT /api/configuracoes/chave
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "valor": "novo_valor"
}
```

---

## 📋 Papéis e Permissões

| Ação | Admin | Gerente | Operador | Usuário |
|------|-------|---------|----------|----------|
| Criar Produto | ✅ | ✅ | ❌ | ❌ |
| Editar Produto | ✅ | ✅ | ❌ | ❌ |
| Deletar Produto | ✅ | ❌ | ❌ | ❌ |
| Criar Pedido | ✅ | ✅ | ❌ | ❌ |
| Registrar Movimentação | ✅ | ✅ | ✅ | ❌ |
| Ver Relatórios | ✅ | ✅ | ❌ | ❌ |
| Ver Auditoria | ✅ | ❌ | ❌ | ❌ |
| Configurar Sistema | ✅ | ❌ | ❌ | ❌ |

---

## 📧 Email

O sistema suporta:
- ✅ Avisos de vencimento
- ✅ Alertas de estoque baixo
- ✅ Notificações de pedidos
- ✅ Fila com retry automático
- ✅ Backoff exponencial

---

## 🔐 Segurança

- ✅ JWT com expiração
- ✅ Hash de senhas com bcryptjs
- ✅ Controle de acesso por papel
- ✅ HTTPS em produção
- ✅ Rate limiting recomendado
- ✅ Validação de entrada
- ✅ Auditoria completa

---

## 📊 Agendamento Automático

- ⏰ **5 min**: Processa fila de emails
- ⏰ **00:00**: Verifica vencimentos
- ⏰ **A cada hora**: Health check

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Versão:** 3.0.0  
**Data:** 2026-06-20  
**Autor:** gleisons21