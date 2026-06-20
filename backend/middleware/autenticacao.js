const { verificarToken } = require('../services/autenticacaoService');

const autenticar = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Token nao fornecido'
      });
    }

    const token = authHeader.substring(7);
    const resultado = verificarToken(token);

    if (!resultado.valido) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Token invalido ou expirado'
      });
    }

    req.usuario = resultado.dados;
    req.token = token;
    req.ipAddress = req.ip || req.connection.remoteAddress;

    next();
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

const autorizar = (...papelPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuario nao autenticado'
      });
    }

    if (!papelPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Acesso negado. Papel requerido: ' + papelPermitidos.join(', ')
      });
    }

    next();
  };
};

module.exports = {
  autenticar,
  autorizar
};