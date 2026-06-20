const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');

router.get('/', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criada_em DESC LIMIT 50', [req.usuario.id]);
    const naoLidas = resultado.rows.filter(n => !n.lida).length;
    res.json({ sucesso: true, notificacoes: resultado.rows, naoLidas });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/:id/marcar-lida', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('UPDATE notificacoes SET lida = true, lida_em = CURRENT_TIMESTAMP WHERE id = $1 AND usuario_id = $2 RETURNING *', [req.params.id, req.usuario.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Notificacao nao encontrada' });
    }

    res.json({ sucesso: true, notificacao: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM notificacoes WHERE id = $1 AND usuario_id = $2', [req.params.id, req.usuario.id]);
    res.json({ sucesso: true, mensagem: 'Notificacao deletada' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;