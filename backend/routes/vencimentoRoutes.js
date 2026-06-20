const express = require('express');
const router = express.Router();
const {
  buscarProdutosProximosAVencer,
  buscarProdutosVencidos,
  dispararAvisosVencimento
} = require('../services/vencimentoService');

/**
 * GET /api/vencimento/proximos
 * Busca produtos próximos a vencer
 */
router.get('/proximos', async (req, res) => {
  try {
    const dias = req.query.dias || 7;
    const produtos = await buscarProdutosProximosAVencer(dias);
    
    res.json({
      sucesso: true,
      quantidade: produtos.length,
      dias_alerta: dias,
      produtos
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

/**
 * GET /api/vencimento/vencidos
 * Busca produtos já vencidos
 */
router.get('/vencidos', async (req, res) => {
  try {
    const produtos = await buscarProdutosVencidos();
    
    res.json({
      sucesso: true,
      quantidade: produtos.length,
      produtos
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

/**
 * POST /api/vencimento/disparar-avisos
 * Dispara avisos de vencimento por email
 */
router.post('/disparar-avisos', async (req, res) => {
  try {
    const dias = req.body.dias || 7;
    const resultado = await dispararAvisosVencimento(dias);
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

module.exports = router;