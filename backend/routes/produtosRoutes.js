const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');
const { registrarAuditoria } = require('../services/autenticacaoService');

router.post('/', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { nome, descricao, sku, categoria_id, preco_custo, preco_venda, quantidade_minima, data_validade } = req.body;

    if (!nome || !sku) {
      return res.status(400).json({ sucesso: false, erro: 'Nome e SKU sao obrigatorios' });
    }

    const skuExistente = await pool.query('SELECT id FROM produtos WHERE sku = $1', [sku]);
    if (skuExistente.rows.length > 0) {
      return res.status(400).json({ sucesso: false, erro: 'SKU ja existe' });
    }

    const query = 'INSERT INTO produtos (nome, descricao, sku, categoria_id, preco_custo, preco_venda, quantidade_minima, data_validade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';

    const resultado = await pool.query(query, [nome, descricao, sku, categoria_id || null, preco_custo || 0, preco_venda || 0, quantidade_minima || 10, data_validade || null]);

    const produto = resultado.rows[0];

    await registrarAuditoria(req.usuario.id, 'CRIAR', 'produtos', produto.id, null, produto, req.ipAddress);

    res.status(201).json({ sucesso: true, mensagem: 'Produto criado com sucesso', produto });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/', autenticar, async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const offset = (pagina - 1) * limite;

    const totalResultado = await pool.query('SELECT COUNT(*) FROM produtos');
    const total = parseInt(totalResultado.rows[0].count);

    const query = 'SELECT p.*, c.nome as categoria_nome FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id ORDER BY p.nome LIMIT $1 OFFSET $2';

    const resultado = await pool.query(query, [limite, offset]);

    res.json({ sucesso: true, total, pagina, limite, produtos: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/:id', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM produtos WHERE id = $1', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Produto nao encontrado' });
    }

    res.json({ sucesso: true, produto: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/:id', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { nome, descricao, sku, categoria_id, preco_custo, preco_venda, quantidade_minima, data_validade } = req.body;

    const resultado = await pool.query('UPDATE produtos SET nome = COALESCE($1, nome), descricao = COALESCE($2, descricao), sku = COALESCE($3, sku), categoria_id = COALESCE($4, categoria_id), preco_custo = COALESCE($5, preco_custo), preco_venda = COALESCE($6, preco_venda), quantidade_minima = COALESCE($7, quantidade_minima), data_validade = COALESCE($8, data_validade) WHERE id = $9 RETURNING *', [nome, descricao, sku, categoria_id, preco_custo, preco_venda, quantidade_minima, data_validade, req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Produto nao encontrado' });
    }

    const produto = resultado.rows[0];

    await registrarAuditoria(req.usuario.id, 'ATUALIZAR', 'produtos', produto.id, null, produto, req.ipAddress);

    res.json({ sucesso: true, mensagem: 'Produto atualizado com sucesso', produto });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.delete('/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING id, nome', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Produto nao encontrado' });
    }

    const produto = resultado.rows[0];

    await registrarAuditoria(req.usuario.id, 'DELETAR', 'produtos', produto.id, produto, null, req.ipAddress);

    res.json({ sucesso: true, mensagem: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;