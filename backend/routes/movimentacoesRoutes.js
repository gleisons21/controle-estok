const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');
const { registrarAuditoria } = require('../services/autenticacaoService');
const { adicionarAFila } = require('../services/filaEmailService');

router.post('/', autenticar, autorizar('admin', 'gerente', 'operador'), async (req, res) => {
  try {
    const { produto_id, tipo, quantidade, motivo } = req.body;

    if (!produto_id || !tipo || !quantidade) {
      return res.status(400).json({ sucesso: false, erro: 'Produto, tipo e quantidade sao obrigatorios' });
    }

    if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ sucesso: false, erro: 'Tipo invalido. Use: entrada, saida, ajuste' });
    }

    const produtoResultado = await pool.query('SELECT * FROM produtos WHERE id = $1', [produto_id]);

    if (produtoResultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Produto nao encontrado' });
    }

    const produto = produtoResultado.rows[0];

    const estoqueResultado = await pool.query('SELECT * FROM estoque WHERE produto_id = $1', [produto_id]);

    let novaQuantidade;

    if (estoqueResultado.rows.length === 0) {
      if (tipo === 'saida') {
        return res.status(400).json({ sucesso: false, erro: 'Nao ha estoque para saida' });
      }
      novaQuantidade = quantidade;
      await pool.query('INSERT INTO estoque (produto_id, quantidade) VALUES ($1, $2)', [produto_id, quantidade]);
    } else {
      const quantidadeAtual = estoqueResultado.rows[0].quantidade;

      if (tipo === 'entrada') {
        novaQuantidade = quantidadeAtual + quantidade;
      } else if (tipo === 'saida') {
        if (quantidadeAtual < quantidade) {
          return res.status(400).json({ sucesso: false, erro: 'Estoque insuficiente. Disponivel: ' + quantidadeAtual });
        }
        novaQuantidade = quantidadeAtual - quantidade;
      } else if (tipo === 'ajuste') {
        novaQuantidade = quantidade;
      }

      await pool.query('UPDATE estoque SET quantidade = $1, atualizado_em = CURRENT_TIMESTAMP WHERE produto_id = $2', [novaQuantidade, produto_id]);
    }

    const movResultado = await pool.query('INSERT INTO movimentacoes (produto_id, tipo, quantidade, usuario_id, motivo) VALUES ($1, $2, $3, $4, $5) RETURNING *', [produto_id, tipo, quantidade, req.usuario.id, motivo || '']);

    const movimentacao = movResultado.rows[0];

    await registrarAuditoria(req.usuario.id, 'MOVIMENTACAO', 'produtos', produto_id, null, { tipo, quantidade, novaQuantidade }, req.ipAddress);

    if (novaQuantidade <= produto.quantidade_minima) {
      const usuario = await pool.query('SELECT email FROM usuarios WHERE papel = $1 LIMIT 1', ['admin']);

      if (usuario.rows.length > 0) {
        const html = '<div style="font-family: Arial; background: #fff3cd; padding: 20px; border-radius: 5px;"><h2>Alerta de Estoque Baixo</h2><p>O produto <strong>' + produto.nome + '</strong> atingiu o estoque minimo.</p><p><strong>Quantidade atual:</strong> ' + novaQuantidade + '</p><p><strong>Minimo:</strong> ' + produto.quantidade_minima + '</p></div>';
        await adicionarAFila(usuario.rows[0].email, 'Alerta: Estoque Baixo', html, 'estoque_baixo', produto_id);
      }
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Movimentacao registrada com sucesso',
      movimentacao: {
        ...movimentacao,
        quantidade_anterior: tipo === 'entrada' ? novaQuantidade - quantidade : novaQuantidade + quantidade,
        quantidade_novo: novaQuantidade
      }
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/', autenticar, async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const offset = (pagina - 1) * limite;
    const { produto_id, tipo } = req.query;

    let query = 'SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome FROM movimentacoes m LEFT JOIN produtos p ON m.produto_id = p.id LEFT JOIN usuarios u ON m.usuario_id = u.id WHERE 1=1';
    const params = [];

    if (produto_id) {
      query += ' AND m.produto_id = $' + (params.length + 1);
      params.push(produto_id);
    }

    if (tipo) {
      query += ' AND m.tipo = $' + (params.length + 1);
      params.push(tipo);
    }

    query += ' ORDER BY m.data_movimentacao DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limite, offset);

    const resultado = await pool.query(query, params);

    res.json({ sucesso: true, movimentacoes: resultado.rows, pagina, limite });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/relatorio', autenticar, async (req, res) => {
  try {
    const query = 'SELECT m.tipo, COUNT(*) as total, SUM(m.quantidade) as quantidade_total FROM movimentacoes m WHERE m.data_movimentacao > NOW() - INTERVAL \'30 days\' GROUP BY m.tipo';

    const resultado = await pool.query(query);

    res.json({ sucesso: true, relatorio: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;