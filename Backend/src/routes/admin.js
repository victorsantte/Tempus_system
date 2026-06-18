const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.use(autenticar, apenasAdmin);

// GET /admin/usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, perfil: true, permissoes: true, createdAt: true },
      orderBy: { nome: 'asc' },
    });
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// POST /admin/usuarios
router.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, perfil, permissoes } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const hash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, perfil: perfil || 'contador', permissoes: permissoes || null },
      select: { id: true, nome: true, email: true, perfil: true, permissoes: true },
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email já cadastrado.' });
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// PUT /admin/usuarios/:id
router.put('/usuarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, email, perfil, permissoes, senha } = req.body;

    const data = { nome, email, perfil, permissoes };
    if (senha) data.senha = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, perfil: true, permissoes: true },
    });

    res.json(usuario);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /admin/usuarios/:id
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.usuario.delete({ where: { id } });
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;
