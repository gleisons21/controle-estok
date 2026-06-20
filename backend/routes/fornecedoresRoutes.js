const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');
const { registrarAuditoria } = require('../services/autenticacaoService');

router.post('/', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { nome, email, telefone, endereco, cidade, estado, cep } = req.body;

    if (!nome) {
      return res.status(400).json({ sucesso: false, erro: 'Nome eh obrigatorio' });
    }

    const query = 'INSERT INTO fornecedores (nome, email, telefone, endereco, cidade, estado, cep) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const resultado = await pool.query(query, [nome, email, telefone, endereco, cidade, estado, cep]);
    const fornecedor = resultado.rows[0];

    await registrarAuditoria(req.usuario.id, 'CRIAR', 'fornecedores', fornecedor.id, null, fornecedor, req.ipAddress);

    res.status(201).json({ sucesso: true, mensagem: 'Fornecedor criado com sucesso', fornecedor });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM fornecedores WHERE ativo = true ORDER BY nome');
    res.json({ sucesso: true, total: resultado.rows.length, fornecedores: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/:id', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM fornecedores WHERE id = $1', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Fornecedor nao encontrado' });
    }

    res.json({ sucesso: true, fornecedor: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/:id', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { nome, email, telefone, endereco, cidade, estado, cep } = req.body;
    const resultado = await pool.query('UPDATE fornecedores SET nome = COALESCE($1, nome), email = COALESCE($2, email), telefone = COALESCE($3, telefone), endereco = COALESCE($4, endereco), cidade = COALESCE($5, cidade), estado = COALESCE($6, estado), cep = COALESCE($7, cep) WHERE id = $8 RETURNING *', [nome, email, telefone, endereco, cidade, estado, cep, req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Fornecedor nao encontrado' });
    }

    res.json({ sucesso: true, mensagem: 'Fornecedor atualizado', fornecedor: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.delete('/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const resultado = await pool.query('UPDATE fornecedores SET ativo = false WHERE id = $1 RETURNING id', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Fornecedor nao encontrado' });
    }

    res.json({ sucesso: true, mensagem: 'Fornecedor deletado' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;