const express = require('express');
const cors = require('cors');
const vencimentoRoutes = require('./routes/vencimentoRoutes');
const emailRoutes = require('./routes/emailRoutes');
const { agendarTarefas } = require('./config/scheduler');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Iniciar agendador de tarefas
console.log('\n🚀 Iniciando servidor de Controle de Estoque...\n');
agendarTarefas();

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Controle de Estoque',
    version: '1.1.0',
    status: 'online',
    features: [
      'Gerenciamento de Produtos',
      'Avisos de Vencimento',
      'Fila de Emails com Retry Automático'
    ],
    endpoints: {
      vencimento: '/api/vencimento',
      emails: '/api/emails'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Rotas
app.use('/api/vencimento', vencimentoRoutes);
app.use('/api/emails', emailRoutes);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    erro: 'Rota não encontrada',
    path: req.path
  });
});

// Tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro:', error);
  res.status(500).json({ 
    erro: error.message,
    status: 'erro'
  });
});

// Porta
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📧 Sistema de fila de emails ATIVO`);
  console.log(`��� Avisos de vencimento ATIVO\n`);
});

module.exports = app;