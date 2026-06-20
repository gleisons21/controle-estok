# 📧 Sistema de Avisos de Vencimento

## Visão Geral

O sistema agora possui funcionalidade automática de envio de emails para alertar sobre produtos próximos a vencer ou já vencidos.

## 🔧 Configuração

### 1. Instalar Dependências

```bash
npm install nodemailer node-cron
```

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e adicione:

```env
# Gmail/SMTP
EMAIL_SERVICE=gmail
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_app_google

# Scheduler
SCHEDULER_INTERVAL=24
```

### 3. Criar Senha de App (Gmail)

Se usar Gmail:
1. Ative autenticação de dois fatores
2. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Gere uma senha de aplicativo
4. Use essa senha no `.env`

## 📡 Endpoints da API

### Buscar Produtos Próximos a Vencer

```http
GET /api/vencimento/proximos?dias=7
```

**Parâmetros:**
- `dias` (opcional): Número de dias para considerar (padrão: 7)

**Resposta (200):**
```json
{
  "sucesso": true,
  "quantidade": 2,
  "dias_alerta": 7,
  "produtos": [
    {
      "id": 1,
      "nome": "Produto A",
      "data_validade": "2026-06-25",
      "lote": "LOTE001",
      "dias_para_vencer": 5,
      "email": "admin@email.com"
    }
  ]
}
```

### Buscar Produtos Vencidos

```http
GET /api/vencimento/vencidos
```

**Resposta (200):**
```json
{
  "sucesso": true,
  "quantidade": 1,
  "produtos": [
    {
      "id": 2,
      "nome": "Produto B",
      "data_validade": "2026-06-10",
      "lote": "LOTE002",
      "dias_vencido": 10,
      "email": "admin@email.com"
    }
  ]
}
```

### Disparar Avisos Manuais

```http
POST /api/vencimento/disparar-avisos
Content-Type: application/json

{
  "dias": 7
}
```

**Resposta (200):**
```json
{
  "sucesso": true,
  "avisos": 2,
  "total": 2,
  "erros": [],
  "mensagem": "2 aviso(s) enviado(s) com sucesso"
}
```

## ⏰ Automação

O sistema executa automaticamente a cada **24 horas** (00:00) para:
1. Buscar produtos próximos a vencer (nos próximos 7 dias)
2. Enviar emails de aviso
3. Registrar os avisos no banco de dados

## 💾 Banco de Dados

### Novas Colunas em `produtos`
- `data_validade` (DATE): Data de validade do produto
- `lote` (VARCHAR): Número/identificação do lote

### Tabela `avisos_vencimento`
Rastreia todos os avisos enviados:
- `id`: ID único
- `produto_id`: Referência ao produto
- `usuario_id`: Usuário que recebeu o aviso
- `email`: Email do destinatário
- `data_validade`: Data de validade do produto
- `dias_para_vencer`: Dias até vencer no momento do envio
- `status`: Status do aviso (enviado, lido, etc)
- `data_envio`: Quando o aviso foi enviado

## 📧 Exemplo de Email Enviado

O email contém:
- ⚠️ Cabeçalho destacando o aviso
- 📦 Nome do produto
- 📅 Data de validade
- ⏰ Dias para vencer
- 🏷️ Número do lote
- Layout responsivo e profissional

## 🚀 Iniciar o Projeto

```bash
# Instalar dependências
cd backend
npm install

# Configurar banco de dados
psql -U postgres < ../database/schema.sql
psql -U postgres < ../database/schema-update-vencimento.sql

# Executar
cp .env.example .env
# Edite o .env com suas configurações
npm run dev
```

## 🔐 Segurança

- Senhas de email armazenadas em variáveis de ambiente
- Emails são enviados de forma segura via SMTP
- Avisos registrados no banco para auditoria

## 📝 Próximas Melhorias

- [ ] Dashboard com alertas visuais
- [ ] Notificações push
- [ ] SMS alerts
- [ ] Relatórios customizados
- [ ] Integração com Slack/Discord

---

**Última atualização:** 2026-06-20