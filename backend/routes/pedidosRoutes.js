const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');
const { registrarAuditoria } = require('../services/autenticacaoService');
const { adicionarAFila } = require('../services/filaEmailService');

const gerarNumeroPedido = () => {
  const timestamp = Date.now().toString();
  const aleatorio = Math.random().toString(36).substring(2, 8);
  return 'PED-' + timestamp.slice(-6) + '-' + aleatorio.toUpperCase();
};

router.post('/', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { fornecedor_id, itens, observacoes } = req.body;

    if (!fornecedor_id || !itens || itens.length === 0) {
      return res.status(400).json({ sucesso: false, erro: 'Fornecedor e itens sao obrigatorios' });
    }

    const numero_pedido = gerarNumeroPedido();
    let total = 0;

    // Calcular total
    for (const item of itens) {
      total += item.quantidade * item.preco_unitario;
    }

    const pedidoResultado = await pool.query(
      'INSERT INTO pedidos (numero_pedido, fornecedor_id, total, observacoes, criado_por) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [numero_pedido, fornecedor_id, total, observacoes, req.usuario.id]
    );

    const pedido = pedidoResultado.rows[0];

    // Adicionar itens
    for (const item of itens) {
      const subtotal = item.quantidade * item.preco_unitario;
      await pool.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [pedido.id, item.produto_id, item.quantidade, item.preco_unitario, subtotal]
      );
    }

    // Buscar fornecedor para enviar email
    const fornecedor = await pool.query('SELECT email FROM fornecedores WHERE id = $1', [fornecedor_id]);
    if (fornecedor.rows[0]?.email) {
      const html = '<h2>Novo Pedido: ' + numero_pedido + '</h2><p>Total: R$ ' + total.toFixed(2) + '</p>';
      await adicionarAFila(fornecedor.rows[0].email, 'Novo Pedido Recebido: ' + numero_pedido, html, 'pedido', pedido.id);
    }

    await registrarAuditoria(req.usuario.id, 'CRIAR', 'pedidos', pedido.id, null, pedido, req.ipAddress);

    res.status(201).json({ sucesso: true, mensagem: 'Pedido criado com sucesso', pedido });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/', autenticar, async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const offset = (pagina - 1) * limite;
    const { status } = req.query;

    let query = 'SELECT p.*, f.nome as fornecedor_nome FROM pedidos p LEFT JOIN fornecedores f ON p.fornecedor_id = f.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND p.status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY p.criado_em DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limite, offset);

    const resultado = await pool.query(query, params);
    res.json({ sucesso: true, pedidos: resultado.rows, pagina, limite });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/:id', autenticar, async (req, res) => {
  try {
    const pedido = await pool.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    if (pedido.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Pedido nao encontrado' });
    }

    const itens = await pool.query('SELECT * FROM pedido_itens WHERE pedido_id = $1', [req.params.id]);

    res.json({ sucesso: true, pedido: pedido.rows[0], itens: itens.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/:id/status', autenticar, autorizar('admin', 'gerente'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pendente', 'confirmado', 'em_transito', 'entregue', 'cancelado'].includes(status)) {
      return res.status(400).json({ sucesso: false, erro: 'Status invalido' });
    }

    const resultado = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Pedido nao encontrado' });
    }

    await registrarAuditoria(req.usuario.id, 'ATUALIZAR', 'pedidos', req.params.id, null, { status }, req.ipAddress);

    res.json({ sucesso: true, mensagem: 'Status atualizado', pedido: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;