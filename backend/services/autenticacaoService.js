const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const pool = require('../config/database');
require('dotenv').config();

const hashSenha = async (senha) => {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(senha, salt);
};

const compararSenha = async (senha, senhaHash) => {
  return await bcryptjs.compare(senha, senhaHash);
};

const gerarToken = (usuarioId, email, papel) => {
  const token = jwt.sign(
    { id: usuarioId, email: email, papel: papel },
    process.env.JWT_SECRET || 'sua_chave_secreta',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  return token;
};

const verificarToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    return { valido: true, dados: decoded };
  } catch (error) {
    return { valido: false, erro: error.message };
  }
};

const hashToken = (token) => {
  return require('crypto').createHash('sha256').update(token).digest('hex');
};

const criarSessao = async (usuarioId, token, ipAddress, userAgent) => {
  try {
    const tokenHash = hashToken(token);
    const dataExpiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const query = 'INSERT INTO sessoes (usuario_id, token_hash, ip_address, user_agent, data_expiracao) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    await pool.query(query, [usuarioId, tokenHash, ipAddress, userAgent, dataExpiracao]);
    console.log('Sessao criada para usuario ' + usuarioId);
  } catch (error) {
    console.error('Erro ao criar sessao:', error);
  }
};

const invalidarSessao = async (token) => {
  try {
    const tokenHash = hashToken(token);
    const query = 'UPDATE sessoes SET ativo = false WHERE token_hash = $1';
    await pool.query(query, [tokenHash]);
    console.log('Sessao invalidada');
  } catch (error) {
    console.error('Erro ao invalidar sessao:', error);
  }
};

const registrarAuditoria = async (usuarioId, acao, tabela, registroId, dadosAntigos = null, dadosNovos = null, ipAddress = null) => {
  try {
    const query = 'INSERT INTO auditoria (usuario_id, acao, tabela, registro_id, dados_antigos, dados_novos, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    await pool.query(query, [
      usuarioId,
      acao,
      tabela,
      registroId,
      dadosAntigos ? JSON.stringify(dadosAntigos) : null,
      dadosNovos ? JSON.stringify(dadosNovos) : null,
      ipAddress
    ]);
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};

module.exports = {
  hashSenha,
  compararSenha,
  gerarToken,
  verificarToken,
  criarSessao,
  invalidarSessao,
  registrarAuditoria
};