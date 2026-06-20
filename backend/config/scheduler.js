const cron = require('node-cron');
const { dispararAvisosVencimento } = require('../services/vencimentoService');

/**
 * Agenda tarefas automáticas
 */
const agendarTarefas = () => {
  // Executar a cada 24 horas (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🔔 Iniciando verificação de produtos próximos a vencer...');
    try {
      await dispararAvisosVencimento(7);
      console.log('✅ Verificação concluída\n');
    } catch (error) {
      console.error('❌ Erro na verificação automática:', error);
    }
  });

  console.log('⏰ Agendador de tarefas iniciado');
};

module.exports = { agendarTarefas };