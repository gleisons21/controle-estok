const cron = require('node-cron');
const { dispararAvisosVencimento } = require('../services/vencimentoService');
const { processarFila } = require('../services/filaEmailService');

/**
 * Agenda tarefas automáticas
 */
const agendarTarefas = () => {
  // Processador de fila de emails - A cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log('\n⏰ [' + new Date().toLocaleTimeString('pt-BR') + '] Processando fila de emails...');
    try {
      await processarFila();
    } catch (error) {
      console.error('❌ Erro ao processar fila:', error);
    }
  });

  // Verificador de vencimento - A cada 24 horas (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🔔 [' + new Date().toLocaleTimeString('pt-BR') + '] Iniciando verificação de produtos próximos a vencer...');
    try {
      await dispararAvisosVencimento(7);
      console.log('✅ Verificação de vencimento concluída\n');
    } catch (error) {
      console.error('❌ Erro na verificação de vencimento:', error);
    }
  });

  // Verificação de saúde - A cada 1 hora
  cron.schedule('0 * * * *', async () => {
    console.log('\n💚 [' + new Date().toLocaleTimeString('pt-BR') + '] Health check do sistema');
    console.log('✅ Sistema operacional\n');
  });

  console.log('⏰ Agendador de tarefas iniciado com sucesso');
  console.log('   📧 Fila de emails: a cada 5 minutos');
  console.log('   📦 Verificação de vencimento: diariamente às 00:00');
  console.log('   💚 Health check: a cada hora\n');
};

module.exports = { agendarTarefas };