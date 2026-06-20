const express = require('express');
const router = express.Router();
const {
  adicionarAFila,
  processarFila,
  obterStatusFila,
  obterLogsEmails
} = require('../services/filaEmailService');

/**
 * POST /api/emails/adicionar
 * Adiciona email à fila
 */
router.post('/adicionar', async (req, res) => {
  try {
    const { destinatario, assunto, corpoHtml, tipo, referenciaId } = req.body;

    if (!destinatario || !assunto || !corpoHtml) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: destinatario, assunto, corpoHtml'
      });
    }

    const resultado = await adicionarAFila(
      destinatario,
      assunto,
      corpoHtml,
      tipo || 'geral',
      referenciaId || null
    );

    res.status(resultado.sucesso ? 201 : 500).json(resultado);
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

/**
 * POST /api/emails/processar
 * Processa fila de emails manualmente
 */
router.post('/processar', async (req, res) => {
  try {
    const resultado = await processarFila();
    res.json({
      sucesso: true,
      ...resultado
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

/**
 * GET /api/emails/status
 * Retorna status da fila
 */
router.get('/status', async (req, res) => {
  try {
    const status = await obterStatusFila();
    res.json({
      sucesso: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

/**
 * GET /api/emails/logs
 * Retorna logs de emails
 */
router.get('/logs', async (req, res) => {
  try {
    const limite = req.query.limite || 50;
    const logs = await obterLogsEmails(limite);
    res.json({
      sucesso: true,
      quantidade: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

module.exports = router;