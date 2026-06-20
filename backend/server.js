const express = require('express');
const cors = require('cors');
const autenticacaoRoutes = require('./routes/autenticacaoRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const movimentacoesRoutes = require('./routes/movimentacoesRoutes');
const vencimentoRoutes = require('./routes/vencimentoRoutes');
const emailRoutes = require('./routes/emailRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const fornecedoresRoutes = require('./routes/fornecedoresRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const notificacoesRoutes = require('./routes/notificacoesRoutes');
const configuracoesRoutes = require('./routes/configuracoesRoutes');
const { agendarTarefas } = require('./config/scheduler');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Iniciar agendador
console.log('\n🚀 Iniciando servidor de Controle de Estoque...\n');
agendarTarefas();

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Controle de Estoque',
    version: '3.0.0',
    status: 'online',
    features: [
      'Autenticacao com JWT',
      'CRUD de Produtos',
      'Movimentacoes de Estoque',
      'Avisos de Vencimento',
      'Fila de Emails',
      'Gestao de Fornecedores',
      'Pedidos de Compra',
      'Dashboard e Relatorios',
      'Notificacoes em Tempo Real',
      'Auditoria Completa'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api/auth', autenticacaoRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/movimentacoes', movimentacoesRoutes);
app.use('/api/vencimento', vencimentoRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/configuracoes', configuracoesRoutes);

// Tratamento de rotas nao encontradas
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota nao encontrada', path: req.path });
});

// Tratamento de erros global
app.use((error, req, res, next) => {
  console.error('❌ Erro:', error);
  res.status(500).json({ erro: error.message, status: 'erro' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}\n`);
});

module.exports = app;