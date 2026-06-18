const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

// GET /dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [emAndamento, pendentes, concluidas, atrasadasExplicitas, atrasadasImplicitas] = await Promise.all([
      prisma.obrigacao.count({ where: { status: 'em_andamento' } }),
      prisma.obrigacao.count({ where: { status: 'pendente' } }),
      prisma.obrigacao.count({ where: { status: 'concluida' } }),
      // Explicit: user manually set status to 'atrasada'
      prisma.obrigacao.count({ where: { status: 'atrasada' } }),
      // Implicit: still 'pendente' but prazo already passed
      prisma.obrigacao.count({ where: { status: 'pendente', prazo: { lt: hoje } } }),
    ]);
    // Combine both kinds so the card reflects the true total
    const atrasadas = atrasadasExplicitas + atrasadasImplicitas;

    // Fila de Foco — only upcoming actionable obligations (not overdue, not done).
    const filaDeFoco = await prisma.obrigacao.findMany({
      where: {
        status: { in: ['pendente', 'em_andamento'] },
        prazo:  { gte: hoje },
      },
      include: {
        cliente: { select: { nome: true } },
        filial:  { select: { apelido: true, nome: true } },
      },
      orderBy: { prazo: 'asc' },
      take: 8,
    });

    // Demandas — total count per status, computed dynamically from the whole table.
    const STATUS_LABELS = {
      pendente:     'Pendente',
      em_andamento: 'Em Andamento',
      concluida:    'Concluída',
      atrasada:     'Atrasada',
    };
    const STATUS_ORDER = ['pendente', 'em_andamento', 'concluida', 'atrasada'];

    const grupoPorStatus = await prisma.obrigacao.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const demandas = STATUS_ORDER
      .map((key) => {
        const found = grupoPorStatus.find((g) => g.status === key);
        return { key, label: STATUS_LABELS[key] || key, quantidade: found?._count?.id ?? 0 };
      })
      .filter((d) => d.quantidade > 0);

    res.json({
      stats: { emAndamento, pendentes, atrasadas, concluidas },
      filaDeFoco,
      demandas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
});

module.exports = router;
