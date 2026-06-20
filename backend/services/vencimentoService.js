const pool = require('../config/database');
const { enviarAvisoVencimento } = require('./emailService');

/**
 * Busca produtos próximos a vencer
 * @param {number} diasAlerta - Número de dias para considerar como alerta (padrão: 7)
 */
const buscarProdutosProximosAVencer = async (diasAlerta = 7) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.nome,
        p.data_validade,
        p.lote,
        CAST(DATE_PART('day', p.data_validade - CURRENT_DATE) AS INTEGER) as dias_para_vencer,
        u.email,
        u.id as usuario_id
      FROM produtos p
      LEFT JOIN usuarios u ON u.papel = 'admin'
      WHERE 
        p.data_validade IS NOT NULL
        AND p.data_validade > CURRENT_DATE
        AND p.data_validade <= CURRENT_DATE + INTERVAL '${diasAlerta} days'
      ORDER BY p.data_validade ASC
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows;
  } catch (error) {
    console.error('Erro ao buscar produtos próximos a vencer:', error);
    throw error;
  }
};

/**
 * Busca produtos já vencidos
 */
const buscarProdutosVencidos = async () => {
  try {
    const query = `
      SELECT 
        p.id,
        p.nome,
        p.data_validade,
        p.lote,
        CAST(DATE_PART('day', CURRENT_DATE - p.data_validade) AS INTEGER) as dias_vencido,
        u.email,
        u.id as usuario_id
      FROM produtos p
      LEFT JOIN usuarios u ON u.papel = 'admin'
      WHERE 
        p.data_validade IS NOT NULL
        AND p.data_validade < CURRENT_DATE
      ORDER BY p.data_validade DESC
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows;
  } catch (error) {
    console.error('Erro ao buscar produtos vencidos:', error);
    throw error;
  }
};

/**
 * Registra aviso de vencimento no banco de dados
 */
const registrarAviso = async (produtoId, usuarioId, email, dataValidade, diasParaVencer) => {
  try {
    const query = `
      INSERT INTO avisos_vencimento 
      (produto_id, usuario_id, email, data_validade, dias_para_vencer)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [
      produtoId,
      usuarioId,
      email,
      dataValidade,
      diasParaVencer
    ]);
    
    return resultado.rows[0];
  } catch (error) {
    console.error('Erro ao registrar aviso:', error);
    throw error;
  }
};

/**
 * Dispara avisos de vencimento
 */
const dispararAvisosVencimento = async (diasAlerta = 7) => {
  try {
    const produtos = await buscarProdutosProximosAVencer(diasAlerta);
    
    if (produtos.length === 0) {
      console.log('✅ Nenhum produto próximo a vencer no momento');
      return { sucesso: true, avisos: 0, mensagem: 'Nenhum produto próximo a vencer' };
    }
    
    console.log(`📧 Enviando avisos para ${produtos.length} produto(s)...`);
    
    let avisosEnviados = 0;
    const erros = [];
    
    for (const produto of produtos) {
      try {
        // Enviar email
        const resultadoEmail = await enviarAvisoVencimento(
          produto.email,
          produto.nome,
          produto.data_validade,
          produto.dias_para_vencer,
          produto.lote
        );
        
        if (resultadoEmail.sucesso) {
          // Registrar no banco de dados
          await registrarAviso(
            produto.id,
            produto.usuario_id,
            produto.email,
            produto.data_validade,
            produto.dias_para_vencer
          );
          avisosEnviados++;
        }
      } catch (error) {
        erros.push({
          produto: produto.nome,
          erro: error.message
        });
      }
    }
    
    return {
      sucesso: true,
      avisos: avisosEnviados,
      total: produtos.length,
      erros: erros,
      mensagem: `${avisosEnviados} aviso(s) enviado(s) com sucesso`
    };
  } catch (error) {
    console.error('Erro ao disparar avisos:', error);
    throw error;
  }
};

module.exports = {
  buscarProdutosProximosAVencer,
  buscarProdutosVencidos,
  registrarAviso,
  dispararAvisosVencimento
};