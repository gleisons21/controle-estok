const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');

router.get('/dashboard', autenticar, async (req, res) => {
  try {
    // Total de produtos
    const totalProdutos = await pool.query('SELECT COUNT(*) as total FROM produtos');
    
    // Total de estoque
    const totalEstoque = await pool.query('SELECT SUM(quantidade) as total FROM estoque');
    
    // Produtos com estoque baixo
    const estoqueBaixo = await pool.query('SELECT COUNT(*) as total FROM estoque e LEFT JOIN produtos p ON e.produto_id = p.id WHERE e.quantidade <= p.quantidade_minima');
    
    // Movimentacoes do mes
    const movimentacoesMes = await pool.query('SELECT COUNT(*) as total FROM movimentacoes WHERE data_movimentacao > NOW() - INTERVAL \'30 days\'');
    
    // Top 5 produtos mais movimentados
    const topProdutos = await pool.query('SELECT p.nome, COUNT(*) as movimentacoes FROM movimentacoes m LEFT JOIN produtos p ON m.produto_id = p.id GROUP BY p.id, p.nome ORDER BY movimentacoes DESC LIMIT 5');
    
    // Produtos proximos a vencer
    const proximosVencer = await pool.query('SELECT p.nome, p.data_validade FROM produtos p WHERE p.data_validade IS NOT NULL AND p.data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\' ORDER BY p.data_validade ASC');
    
    // Pedidos pendentes
    const pedidosPendentes = await pool.query('SELECT COUNT(*) as total FROM pedidos WHERE status IN (\'pendente\', \'confirmado\', \'em_transito\')');
    
    res.json({
      sucesso: true,
      dashboard: {
        totalProdutos: parseInt(totalProdutos.rows[0].total),
        totalEstoque: parseInt(totalEstoque.rows[0].total) || 0,
        estoqueBaixo: parseInt(estoqueBaixo.rows[0].total),
        movimentacoesMes: parseInt(movimentacoesMes.rows[0].total),
        pedidosPendentes: parseInt(pedidosPendentes.rows[0].total),
        topProdutos: topProdutos.rows,
        proximosVencer: proximosVencer.rows
      }
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/relatorio/estoque', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT p.nome, p.sku, e.quantidade, p.quantidade_minima, c.nome as categoria FROM estoque e LEFT JOIN produtos p ON e.produto_id = p.id LEFT JOIN categorias c ON p.categoria_id = c.id ORDER BY p.nome');
    res.json({ sucesso: true, relatorio: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/relatorio/vendas', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT DATE(m.data_movimentacao) as data, COUNT(*) as quantidade, SUM(m.quantidade) as total FROM movimentacoes m WHERE m.tipo = \'saida\' AND m.data_movimentacao > NOW() - INTERVAL \'30 days\' GROUP BY DATE(m.data_movimentacao) ORDER BY data DESC');
    res.json({ sucesso: true, relatorio: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/relatorio/fornecedores', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT f.nome, COUNT(p.id) as total_pedidos, SUM(p.total) as valor_total FROM pedidos p LEFT JOIN fornecedores f ON p.fornecedor_id = f.id GROUP BY f.id, f.nome ORDER BY valor_total DESC');
    res.json({ sucesso: true, relatorio: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/relatorio/auditoria', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 100;
    const resultado = await pool.query('SELECT a.*, u.nome as usuario_nome FROM auditoria a LEFT JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.data_acao DESC LIMIT $1', [limite]);
    res.json({ sucesso: true, auditoria: resultado.rows });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;