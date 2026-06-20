# 📧 Sistema de Fila de Emails com Retry Automático

## 🎯 Visão Geral

Sistema robusto de envio de emails com:
- ✅ Fila de emails persistente
- ✅ Retry automático com backoff exponencial
- ✅ Log completo de todas as tentativas
- ✅ Processamento automático a cada 5 minutos
- ✅ Tratamento de falhas permanentes

## 🛠️ Configuração

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Atualizar Banco de Dados

```bash
psql -U postgres < ../database/schema-fila-emails.sql
```

### 3. Configurar Variáveis de Ambiente

Edite `.env`:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_app_google

# Scheduler
SCHEDULER_FILA_EMAILS=300          # 5 minutos
SCHEDULER_VENCIMENTO=86400         # 24 horas
```

### 4. Usar Senha de App (Gmail)

1. Ative autenticação de dois fatores
2. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Crie uma senha de aplicativo
4. Use no `.env`

## 📡 Endpoints da API

### Adicionar Email à Fila

```http
POST /api/emails/adicionar
Content-Type: application/json

{
  "destinatario": "usuario@email.com",
  "assunto": "Teste de Email",
  "corpoHtml": "<p>Conteúdo do email em HTML</p>",
  "tipo": "vencimento",
  "referenciaId": 1
}
```

**Resposta (201):**
```json
{
  "sucesso": true,
  "filaId": 1
}
```

### Processar Fila Manualmente

```http
POST /api/emails/processar
```

**Resposta (200):**
```json
{
  "sucesso": true,
  "processados": 5,
  "sucesso": 5,
  "erro": 0
}
```

### Obter Status da Fila

```http
GET /api/emails/status
```

**Resposta (200):**
```json
{
  "sucesso": true,
  "status": [
    {"status": "pendente", "quantidade": 3},
    {"status": "enviado", "quantidade": 15},
    {"status": "erro", "quantidade": 1},
    {"status": "falha_permanente", "quantidade": 0}
  ]
}
```

### Obter Logs de Emails

```http
GET /api/emails/logs?limite=50
```

**Resposta (200):**
```json
{
  "sucesso": true,
  "quantidade": 50,
  "logs": [
    {
      "id": 1,
      "fila_email_id": 5,
      "destinatario": "usuario@email.com",
      "assunto": "Aviso de Vencimento",
      "status": "enviado",
      "codigo_erro": null,
      "mensagem_erro": null,
      "tentativa_numero": 1,
      "enviado_em": "2026-06-20T20:30:00.000Z"
    }
  ]
}
```

## 🔄 Fluxo de Funcionamento

### 1️⃣ Adição à Fila
```
Email recebido → Inserido na tabela fila_emails → Status: pendente
```

### 2️⃣ Processamento Automático
```
A cada 5 minutos:
  ├─ Busca emails pendentes
  ├─ Tenta enviar
  ├─ Se OK → Status: enviado
  └─ Se erro → Agenda retry com backoff exponencial
```

### 3️⃣ Retry Automático
```
Tentativa 1: Falha → Retry em 2 minutos (2^1)
Tentativa 2: Falha → Retry em 4 minutos (2^2)
Tentativa 3: Falha → Retry em 8 minutos (2^3)
Tentativa 4+: Falha permanente → Status: falha_permanente
```

### 4️⃣ Logging Completo
```
Cada tentativa registrada em log_emails
├─ Status (enviado/erro)
├─ Código de erro
├─ Mensagem de erro
└─ Número da tentativa
```

## 📊 Tabelas do Banco de Dados

### `fila_emails`
- `id`: ID único
- `destinatario`: Email do destinatário
- `assunto`: Assunto do email
- `corpo_html`: Conteúdo HTML
- `tipo`: Tipo (vencimento, geral, etc)
- `referencia_id`: ID da entidade relacionada
- `status`: pendente, enviando, enviado, erro, falha_permanente
- `tentativas`: Número de tentativas
- `max_tentativas`: Máximo de tentativas (padrão: 3)
- `proxima_tentativa`: Data da próxima tentativa
- `erro_mensagem`: Mensagem do último erro
- `criado_em`: Data de criação
- `enviado_em`: Data de envio bem-sucedido

### `log_emails`
- `id`: ID único
- `fila_email_id`: Referência à fila
- `destinatario`: Email do destinatário
- `assunto`: Assunto
- `status`: Status da tentativa
- `codigo_erro`: Código de erro
- `mensagem_erro`: Detalhes do erro
- `tentativa_numero`: Qual tentativa foi
- `enviado_em`: Timestamp

## ⏰ Cronograma Automático

```
✅ Processador de Fila de Emails
   └─ A cada 5 minutos (*/5 * * * *)
   └─ Processa até 10 emails por execução
   └─ Aplicá retry automático com backoff

✅ Verificador de Vencimento
   └─ Diariamente às 00:00 (0 0 * * *)
   └─ Verifica produtos vencendo nos próximos 7 dias
   └─ Adiciona à fila de emails

✅ Health Check
   └─ A cada hora (0 * * * *)
   └─ Monitora saúde do sistema
```

## 🔍 Exemplo Prático

### Cenário: Aviso de Vencimento

```javascript
// 1. Sistema detecta produto vencendo
const aviso = {
  destinatario: 'admin@empresa.com',
  assunto: '⚠️ Aviso de Vencimento: Produto XYZ',
  corpoHtml: '<p>Seu produto vence em 5 dias</p>',
  tipo: 'vencimento',
  referenciaId: 123
};

// 2. Adiciona à fila
await adicionarAFila(aviso);

// 3. A cada 5 minutos, processador tenta enviar
// Se falhar:
//   - 1ª tentativa falha → Retry em 2 min
//   - 2ª tentativa falha → Retry em 4 min
//   - 3ª tentativa falha → Falha permanente

// 4. Administrador monitora via logs
GET /api/emails/logs
```

## 📈 Monitoramento

### Dashboard de Status

```bash
# Ver status geral
curl http://localhost:5000/api/emails/status

# Ver últimos 100 logs
curl http://localhost:5000/api/emails/logs?limite=100
```

### Consultas SQL

```sql
-- Emails ainda na fila
SELECT COUNT(*) FROM fila_emails WHERE status IN ('pendente', 'erro');

-- Taxa de sucesso
SELECT 
  status,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM log_emails
GROUP BY status;

-- Emails com falha permanente
SELECT * FROM fila_emails WHERE status = 'falha_permanente';
```

## 🚀 Iniciar Projeto

```bash
cd backend
npm install
npm run dev
```

## ✨ Características Principais

✅ **Persistência**: Emails não se perdem em caso de falha
✅ **Retry Automático**: Backoff exponencial
✅ **Logging Completo**: Rastreamento de todas as tentativas
✅ **Performance**: Processa até 10 emails por ciclo
✅ **Confiabilidade**: Máximo de 3 tentativas configurável
✅ **Monitoramento**: Status e logs via API

---

**Última atualização:** 2026-06-20