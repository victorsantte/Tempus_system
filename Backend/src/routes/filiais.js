const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

// POST /filiais
router.post('/', async (req, res) => {
  try {
    const { nome, id_cliente, cnpj, apelido, inscricao_estadual, inscricao_municipal,
            cep, logradouro, numero, bairro, cidade, uf, nome_fantasia, telefone, email, status } = req.body;

    if (!nome || !id_cliente) {
      return res.status(400).json({ error: 'Nome e id_cliente são obrigatórios.' });
    }

    const filial = await prisma.filial.create({
      data: { nome, id_cliente, cnpj, apelido, inscricao_estadual, inscricao_municipal,
              cep, logradouro, numero, bairro, cidade, uf, nome_fantasia, telefone, email,
              status: status || 'ativo' },
    });

    res.status(201).json(filial);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'CNPJ de filial já cadastrado.' });
    res.status(500).json({ error: 'Erro ao criar filial.' });
  }
});

// GET /filiais
router.get('/', async (req, res) => {
  try {
    const { q, id_cliente, status } = req.query;
    const where = {};

    if (id_cliente) where.id_cliente = parseInt(id_cliente);
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { apelido: { contains: q, mode: 'insensitive' } },
        { cnpj: { contains: q } },
      ];
    }

    const filiais = await prisma.filial.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { nome: 'asc' },
    });

    res.json(filiais);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar filiais.' });
  }
});

// GET /filiais/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const filial = await prisma.filial.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!filial) return res.status(404).json({ error: 'Filial não encontrada.' });
    res.json(filial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar filial.' });
  }
});

// PUT /filiais/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, id_cliente, cnpj, apelido, inscricao_estadual, inscricao_municipal,
            cep, logradouro, numero, bairro, cidade, uf, nome_fantasia, telefone, email, status } = req.body;

    if (!nome || !id_cliente) return res.status(400).json({ error: 'Nome e id_cliente são obrigatórios.' });

    const filialAtualizada = await prisma.filial.update({
      where: { id },
      data: { nome, id_cliente, cnpj, apelido, inscricao_estadual, inscricao_municipal,
              cep, logradouro, numero, bairro, cidade, uf, nome_fantasia, telefone, email, status },
    });

    res.json(filialAtualizada);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Filial não encontrada.' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'CNPJ de filial já cadastrado.' });
    res.status(500).json({ error: 'Erro ao atualizar filial.' });
  }
});

// DELETE /filiais/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const obrigacoesVinculadas = await prisma.obrigacao.count({ where: { id_filial: id } });
    if (obrigacoesVinculadas > 0) {
      return res.status(409).json({ error: 'Não é possível excluir: filial possui obrigações cadastradas.' });
    }

    await prisma.filial.delete({ where: { id } });
    res.json({ message: 'Filial excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Filial não encontrada.' });
    res.status(500).json({ error: 'Erro ao excluir filial.' });
  }
});

module.exports = router;
