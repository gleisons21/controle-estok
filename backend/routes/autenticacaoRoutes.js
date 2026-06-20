const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, autorizar } = require('../middleware/autenticacao');
const { hashSenha, compararSenha, gerarToken, criarSessao, invalidarSessao, registrarAuditoria } = require('../services/autenticacaoService');

router.post('/registrar', async (req, res) => {
  try {
    const { nome, email, senha, papel } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome, email e senha sao obrigatorios'
      });
    }

    const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Email ja registrado'
      });
    }

    const senhaHash = await hashSenha(senha);

    const query = 'INSERT INTO usuarios (nome, email, senha, papel) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, papel';

    const resultado = await pool.query(query, [nome, email, senhaHash, papel || 'usuario']);

    const usuario = resultado.rows[0];

    await registrarAuditoria(usuario.id, 'CRIAR', 'usuarios', usuario.id, null, { nome, email, papel: usuario.papel }, req.ip);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuario registrado com sucesso',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ sucesso: false, erro: 'Email e senha sao obrigatorios' });
    }

    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({ sucesso: false, erro: 'Email ou senha incorretos' });
    }

    const usuario = resultado.rows[0];

    if (!usuario.ativo) {
      return res.status(403).json({ sucesso: false, erro: 'Usuario inativo' });
    }

    const senhaValida = await compararSenha(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ sucesso: false, erro: 'Email ou senha incorretos' });
    }

    const token = gerarToken(usuario.id, usuario.email, usuario.papel);

    await criarSessao(usuario.id, token, req.ip, req.headers['user-agent']);

    await registrarAuditoria(usuario.id, 'LOGIN', 'usuarios', usuario.id, null, { login: new Date() }, req.ip);

    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.post('/logout', autenticar, async (req, res) => {
  try {
    await invalidarSessao(req.token);
    await registrarAuditoria(req.usuario.id, 'LOGOUT', 'usuarios', req.usuario.id, null, { logout: new Date() }, req.ipAddress);
    res.json({ sucesso: true, mensagem: 'Logout realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.get('/perfil', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios WHERE id = $1', [req.usuario.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Usuario nao encontrado' });
    }

    res.json({ sucesso: true, usuario: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.put('/perfil', autenticar, async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ sucesso: false, erro: 'Nome eh obrigatorio' });
    }

    const resultado = await pool.query('UPDATE usuarios SET nome = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, nome, email, papel', [nome, req.usuario.id]);

    await registrarAuditoria(req.usuario.id, 'ATUALIZAR', 'usuarios', req.usuario.id, null, { nome }, req.ipAddress);

    res.json({ sucesso: true, mensagem: 'Perfil atualizado com sucesso', usuario: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

router.post('/trocar-senha', autenticar, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ sucesso: false, erro: 'Senha atual e nova senha sao obrigatorias' });
    }

    const resultado = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [req.usuario.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Usuario nao encontrado' });
    }

    const senhaValida = await compararSenha(senhaAtual, resultado.rows[0].senha);

    if (!senhaValida) {
      return res.status(401).json({ sucesso: false, erro: 'Senha atual incorreta' });
    }

    const novaHash = await hashSenha(novaSenha);

    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaHash, req.usuario.id]);

    await registrarAuditoria(req.usuario.id, 'TROCAR_SENHA', 'usuarios', req.usuario.id, null, { alteracao: 'Senha alterada' }, req.ipAddress);

    res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;