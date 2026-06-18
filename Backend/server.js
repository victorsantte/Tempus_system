require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());

// Accept any localhost origin so the frontend works on any dev port (3001, 3002, etc.)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin blocked — ${origin}`));
  },
  credentials: true,
}));

// ── API routes (/api prefix on every endpoint) ──────────────────────────────
app.use('/api/health',     require('./src/routes/health'));
app.use('/api/cnpj',       require('./src/routes/cnpj'));
app.use('/api/auth',       require('./src/routes/auth'));
app.use('/api/clientes',   require('./src/routes/clientes'));
app.use('/api/filiais',    require('./src/routes/filiais'));
app.use('/api/obrigacoes', require('./src/routes/obrigacoes'));
app.use('/api/admin',      require('./src/routes/admin'));
app.use('/api/dashboard',  require('./src/routes/dashboard'));

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Tempus API rodando em http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERRO: Porta ${PORT} já está em uso por outro processo.`);
    console.error(`   Rode: lsof -ti :${PORT} | xargs kill -9`);
    console.error(`   Depois reinicie com: npm run dev\n`);
  } else {
    console.error('Erro ao iniciar o servidor:', err);
  }
  process.exit(1);
});
