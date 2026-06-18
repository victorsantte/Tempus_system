const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.', code: 'MISSING_FIELDS' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      // Generic message prevents user-enumeration
      return res.status(401).json({ error: 'Credenciais inválidas.', code: 'INVALID_CREDENTIALS' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas.', code: 'INVALID_CREDENTIALS' });
    }

    // Canonical JWT payload — always includes `role` (maps to perfil in DB)
    const payload = {
      id:    usuario.id,
      email: usuario.email,
      nome:  usuario.nome,
      role:  usuario.perfil,   // 'administrador' | 'contador' | 'auxiliar'
      // legacy alias so older middleware reading perfil still works
      perfil: usuario.perfil,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn:  '8h',
      issuer:     'tempus-api',
      audience:   'tempus-app',
    });

    return res.json({
      token,
      expiresIn: 28800, // 8 h in seconds
      usuario: {
        id:     usuario.id,
        nome:   usuario.nome,
        email:  usuario.email,
        role:   usuario.perfil,
        perfil: usuario.perfil,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Erro interno no servidor.', code: 'SERVER_ERROR' });
  }
});

// ── GET /api/auth/me — verify token and return current user ─────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, nome: true, email: true, perfil: true, permissoes: true, createdAt: true },
    });

    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

    res.json({ ...usuario, role: usuario.perfil });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.json({ message: 'Se o email estiver cadastrado, você receberá as instruções.' });
    }

    const resetToken = jwt.sign(
      { id: usuario.id, email: usuario.email, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ message: 'Token de redefinição gerado com sucesso.', resetToken });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ── POST /api/auth/confirm-reset ────────────────────────────────────────────
router.post('/confirm-reset', async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Token inválido para esta operação.' });
    }

    const hash = await bcrypt.hash(novaSenha, 12);
    await prisma.usuario.update({ where: { id: payload.id }, data: { senha: hash } });

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch {
    res.status(400).json({ error: 'Token inválido ou expirado.' });
  }
});

module.exports = router;
