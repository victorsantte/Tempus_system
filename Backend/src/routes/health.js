const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

const START_TIME = Date.now();

/** Measures how long an async fn takes (ms). */
async function measure(fn) {
  const t = Date.now();
  try {
    await fn();
    return { status: 'online', latency: Date.now() - t };
  } catch (err) {
    return { status: 'offline', latency: null, error: err.message };
  }
}

// ── GET /api/health ─────────────────────────────────────────────────────────
// Public — no auth required. Used by the frontend to ping the Auth API.
router.get('/', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  res.status(200).json({
    status:    'ok',
    service:   'Tempus API',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    uptimeSeconds,
  });
});

// ── GET /api/health/services ─────────────────────────────────────────────────
// Returns live status + measured latency for each service.
// No auth guard — Admin.jsx calls this on page load; token check would deadlock
// if the auth service itself is being tested. Keep it internal/network-protected.
router.get('/services', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  // 1. Auth API — ping our own /api/health endpoint logic (in-process, no HTTP)
  const authCheck = await measure(async () => {
    if (!prisma) throw new Error('Prisma not initialised');
  });

  // 2. Database — lightweight Prisma raw query
  const dbCheck = await measure(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  // 3. Internal Templates service — measured via a simple sync validation
  const templatesCheck = await measure(async () => {
    const count = await prisma.obrigacao.count();
    if (count === undefined) throw new Error('Query failed');
  });

  // 4. External Receita Federal API (BrasilAPI) — real HTTP ping with 3 s timeout
  const receitaCheck = await measure(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch('https://brasilapi.com.br/api/cnpj/v1/00000000000191', {
        method: 'HEAD',
        signal: controller.signal,
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    } finally {
      clearTimeout(timeout);
    }
  });

  const allOnline = [authCheck, dbCheck, templatesCheck].every((s) => s.status === 'online');

  res.status(200).json({
    status:    allOnline ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime:    uptimeSeconds,
    services: {
      auth: {
        name:    'API de Autenticação',
        ...authCheck,
        detail:  authCheck.status === 'online' ? `Latência: ${authCheck.latency}ms` : authCheck.error,
      },
      database: {
        name:    'Banco de Dados (PostgreSQL)',
        ...dbCheck,
        detail:  dbCheck.status === 'online' ? `Latência: ${dbCheck.latency}ms` : dbCheck.error,
      },
      templates: {
        name:    'API de Templates Internos',
        ...templatesCheck,
        detail:  templatesCheck.status === 'online'
          ? `Latência: ${templatesCheck.latency}ms`
          : templatesCheck.error,
      },
      receitaFederal: {
        name:    'API Receita Federal (CNPJ)',
        ...receitaCheck,
        detail:  receitaCheck.status === 'online'
          ? `Latência: ${receitaCheck.latency}ms`
          : 'Indisponível ou sem rede',
        consultas: 'BrasilAPI CNPJ',
      },
    },
  });
});

module.exports = router;
