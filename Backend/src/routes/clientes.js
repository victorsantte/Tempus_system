const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

// POST /clientes
router.post('/', async (req, res) => {
  try {
    const { nome, cnpj, nome_fantasia, inscricao_estadual, telefone, email, regime_tributario, status } = req.body;

    if (!nome || !cnpj) {
      return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });
    }

    const cliente = await prisma.cliente.create({
      data: { nome, cnpj, nome_fantasia, inscricao_estadual, telefone, email, regime_tributario, status: status || 'ativo' },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'CNPJ já cadastrado.' });
    res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
});

// GET /clientes
router.get('/', async (req, res) => {
  try {
    const { q, status } = req.query;
    const where = {};

    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { cnpj: { contains: q } },
        { nome_fantasia: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: { _count: { select: { filiais: true, obrigacoes: true } } },
    });

    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

// GET /clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { filiais: true, obrigacoes: { orderBy: { prazo: 'asc' } } },
    });

    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
});

// PUT /clientes/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, cnpj, nome_fantasia, inscricao_estadual, telefone, email, regime_tributario, status } = req.body;

    if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });

    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: { nome, cnpj, nome_fantasia, inscricao_estadual, telefone, email, regime_tributario, status },
    });

    res.json(clienteAtualizado);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Cliente não encontrado.' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'CNPJ já cadastrado.' });
    res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
});

// DELETE /clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const obrigacoesVinculadas = await prisma.obrigacao.count({ where: { id_cliente: id } });
    if (obrigacoesVinculadas > 0) {
      return res.status(409).json({ error: 'Não é possível excluir: cliente possui obrigações cadastradas.' });
    }

    await prisma.cliente.delete({ where: { id } });
    res.json({ message: 'Cliente excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

module.exports = router;
