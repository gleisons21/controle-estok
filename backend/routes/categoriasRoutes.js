const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');
const { registrarAuditoria } = require('../services/autenticacaoService');

// CATEGORIAS
router.post('/', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ sucesso: false, erro: 'Nome eh obrigatorio' });
    }

    const query = 'INSERT INTO categorias (nome, descricao) VALUES ($1, $2) RETURNING *';
    const resultado = await pool.query(query, [nome, descricao || null]);
    const categoria = resultado.rows[0];

    await registrarAuditoria(req.usuario.id, 'CRIAR', 'categorias', categoria.id, null, categoria, req.ipAddress);

    res.status(201).json({ sucesso: true, mensagem: 'Categoria criada com sucesso', categoria });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM categorias WHERE ativa = true ORDER BY nome');
    res.json({ sucesso: true, categorias: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/:id', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const resultado = await pool.query('UPDATE categorias SET nome = COALESCE($1, nome), descricao = COALESCE($2, descricao) WHERE id = $3 RETURNING *', [nome, descricao, req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Categoria nao encontrada' });
    }

    res.json({ sucesso: true, mensagem: 'Categoria atualizada', categoria: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.delete('/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const resultado = await pool.query('UPDATE categorias SET ativa = false WHERE id = $1 RETURNING id', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Categoria nao encontrada' });
    }

    res.json({ sucesso: true, mensagem: 'Categoria deletada' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;