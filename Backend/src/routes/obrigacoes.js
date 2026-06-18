const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

// ── Template Engine ───────────────────────────────────────────────────────────

/**
 * Tax obligations generated per regime for the current month.
 * Each entry: { descricao, dia } where `dia` is the due day of the month.
 */
const TEMPLATES = {
  'Simples Nacional': [
    { descricao: 'DAS',      dia: 20 },
    { descricao: 'DAE',      dia: 20 },
    { descricao: 'FGTS',     dia: 20 },
    { descricao: 'eSocial',  dia: 15 },
    { descricao: 'DCTFWeb',  dia: 15 },
  ],
  'Lucro Presumido': [
    { descricao: 'PIS',               dia: 25 },
    { descricao: 'COFINS',            dia: 25 },
    { descricao: 'ISS',               dia: 15 },
    { descricao: 'ICMS',              dia: 10 },
    { descricao: 'INSS',              dia: 20 },
    { descricao: 'FGTS',              dia: 20 },
    { descricao: 'DCTF',              dia: 15 },
    { descricao: 'EFD-Contribuições', dia: 10 },
  ],
  'Lucro Real': [
    { descricao: 'PIS',         dia: 25 },
    { descricao: 'COFINS',      dia: 25 },
    { descricao: 'IRPJ Mensal', dia: 25 },
    { descricao: 'CSLL Mensal', dia: 25 },
    { descricao: 'ISS',         dia: 15 },
    { descricao: 'ICMS',        dia: 15 },
    { descricao: 'INSS',        dia: 20 },
    { descricao: 'FGTS',        dia: 20 },
    { descricao: 'DCTF',        dia: 15 },
    { descricao: 'SPED Fiscal', dia: 20 },
  ],
};

/**
 * POST /api/obrigacoes/gerar-template
 * Generates this month's fixed obligations for a client based on their regime_tributario.
 * Returns 409 if obligations for the current month have already been generated.
 */
router.post('/gerar-template', async (req, res) => {
  try {
    const clienteId = parseInt(req.body.cliente_id);
    if (!clienteId || isNaN(clienteId)) {
      return res.status(400).json({ error: 'cliente_id é obrigatório.' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nome: true, regime_tributario: true },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    if (!cliente.regime_tributario) {
      return res.status(422).json({
        error: 'O cliente não possui regime tributário definido. Edite o cadastro e defina o regime antes de gerar obrigações.',
        code: 'NO_REGIME',
      });
    }

    const templates = TEMPLATES[cliente.regime_tributario];
    if (!templates) {
      return res.status(422).json({
        error: `Regime tributário "${cliente.regime_tributario}" não possui template configurado.`,
        code: 'UNKNOWN_REGIME',
      });
    }

    // Current month boundaries (UTC-safe: use local midnight on the 1st)
    const now     = new Date();
    const ano     = now.getFullYear();
    const mes     = now.getMonth();           // 0-indexed
    const inicio  = new Date(ano, mes, 1);
    const fim     = new Date(ano, mes + 1, 1);

    // Duplicate guard — check if ANY template obligation already exists this month
    const existentes = await prisma.obrigacao.findMany({
      where: {
        id_cliente: cliente.id,
        descricao:  { in: templates.map((t) => t.descricao) },
        prazo:      { gte: inicio, lt: fim },
      },
      select: { descricao: true },
    });

    if (existentes.length > 0) {
      const nomeMes = inicio.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      return res.status(409).json({
        error: `As obrigações de ${nomeMes} já foram geradas para este cliente.`,
        code: 'ALREADY_GENERATED',
        existentes: existentes.map((e) => e.descricao),
      });
    }

    // Build records and insert
    await prisma.obrigacao.createMany({
      data: templates.map((t) => ({
        descricao:  t.descricao,
        prazo:      new Date(ano, mes, t.dia),
        status:     'pendente',
        id_cliente: cliente.id,
      })),
    });

    // Return the newly created rows (createMany doesn't return them directly)
    const criadas = await prisma.obrigacao.findMany({
      where: {
        id_cliente: cliente.id,
        descricao:  { in: templates.map((t) => t.descricao) },
        prazo:      { gte: inicio, lt: fim },
      },
      orderBy: { prazo: 'asc' },
    });

    const nomeMes = inicio.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return res.status(201).json({
      message:     `${criadas.length} obrigação(ões) gerada(s) com sucesso para ${nomeMes}.`,
      regime:      cliente.regime_tributario,
      mes:         nomeMes,
      obrigacoes:  criadas,
    });
  } catch (err) {
    console.error('[gerar-template]', err);
    res.status(500).json({ error: 'Erro interno ao gerar obrigações.' });
  }
});

// POST /obrigacoes
router.post('/', async (req, res) => {
  try {
    const { descricao, prazo, status, id_cliente, id_filial } = req.body;

    if (!descricao || !prazo || !id_cliente) {
      return res.status(400).json({ error: 'Descrição, prazo e id_cliente são obrigatórios.' });
    }

    const obrigacao = await prisma.obrigacao.create({
      data: {
        descricao,
        prazo: new Date(prazo),
        status: status || 'pendente',
        id_cliente,
        id_filial: id_filial || null,
      },
      include: { cliente: true, filial: true },
    });

    res.status(201).json(obrigacao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar obrigação.' });
  }
});

// GET /obrigacoes
router.get('/', async (req, res) => {
  try {
    const { q, status, mes, id_cliente, id_filial } = req.query;
    const where = {};

    if (id_cliente) where.id_cliente = parseInt(id_cliente);
    if (id_filial) where.id_filial = parseInt(id_filial);
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { descricao: { contains: q, mode: 'insensitive' } },
        { cliente: { nome: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (mes) {
      const [ano, m] = mes.split('-');
      const inicio = new Date(parseInt(ano), parseInt(m) - 1, 1);
      const fim = new Date(parseInt(ano), parseInt(m), 1);
      where.prazo = { gte: inicio, lt: fim };
    }

    const obrigacoes = await prisma.obrigacao.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        filial: { select: { id: true, nome: true, apelido: true } },
      },
      orderBy: { prazo: 'asc' },
    });

    res.json(obrigacoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar obrigações.' });
  }
});

// GET /obrigacoes/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const obrigacao = await prisma.obrigacao.findUnique({
      where: { id },
      include: { cliente: true, filial: true },
    });

    if (!obrigacao) return res.status(404).json({ error: 'Obrigação não encontrada.' });
    res.json(obrigacao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar obrigação.' });
  }
});

// PUT /obrigacoes/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { descricao, prazo, status, id_cliente, id_filial } = req.body;

    if (!descricao || !prazo || !id_cliente) {
      return res.status(400).json({ error: 'Descrição, prazo e id_cliente são obrigatórios.' });
    }

    const obrigacaoAtualizada = await prisma.obrigacao.update({
      where: { id },
      data: {
        descricao,
        prazo: new Date(prazo),
        status: status || 'pendente',
        id_cliente,
        id_filial: id_filial || null,
      },
      include: { cliente: true, filial: true },
    });

    res.json(obrigacaoAtualizada);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Obrigação não encontrada.' });
    res.status(500).json({ error: 'Erro ao atualizar obrigação.' });
  }
});

// DELETE /obrigacoes/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.obrigacao.delete({ where: { id } });
    res.json({ message: 'Obrigação excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Obrigação não encontrada.' });
    res.status(500).json({ error: 'Erro ao excluir obrigação.' });
  }
});

module.exports = router;
