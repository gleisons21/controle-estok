const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');

router.get('/', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM configuracoes ORDER BY chave');
    res.json({ sucesso: true, configuracoes: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/:chave', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const { valor } = req.body;
    const resultado = await pool.query('UPDATE configuracoes SET valor = $1, atualizado_em = CURRENT_TIMESTAMP WHERE chave = $2 RETURNING *', [valor, req.params.chave]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Configuracao nao encontrada' });
    }

    res.json({ sucesso: true, configuracao: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.post('/criar', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const { chave, valor, tipo, descricao } = req.body;
    const resultado = await pool.query('INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES ($1, $2, $3, $4) RETURNING *', [chave, valor, tipo, descricao]);
    res.status(201).json({ sucesso: true, configuracao: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;