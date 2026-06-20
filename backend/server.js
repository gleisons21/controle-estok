const express = require('express');
const cors = require('cors');
const vencimentoRoutes = require('./routes/vencimentoRoutes');
const { agendarTarefas } = require('./config/scheduler');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Iniciar agendador de tarefas
agendarTarefas();

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Controle de Estoque',
    version: '1.0.0',
    status: 'online',
    features: ['Gerenciamento de Produtos', 'Avisos de Vencimento']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas
app.use('/api/vencimento', vencimentoRoutes);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro:', error);
  res.status(500).json({ erro: error.message });
});

// Porta
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📧 Sistema de avisos de vencimento ATIVO\n`);
});

module.exports = app;