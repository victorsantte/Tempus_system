const express = require('express');
const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(raw) {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return raw.trim();
}

function formatCEP(raw) {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : raw;
}

/**
 * Infere o regime tributário com base nas flags da BrasilAPI.
 * - opcao_pelo_mei  → MEI (subconjunto do Simples Nacional)
 * - opcao_pelo_simples → Simples Nacional
 * - Caso contrário, não é possível determinar via API pública.
 */
function inferirRegime({ opcao_pelo_simples, opcao_pelo_mei }) {
  if (opcao_pelo_mei)      return 'Simples Nacional';
  if (opcao_pelo_simples)  return 'Simples Nacional';
  return '';
}

// ── GET /api/cnpj/:cnpj ───────────────────────────────────────────────────────
router.get('/:cnpj', async (req, res) => {
  const digits = req.params.cnpj.replace(/\D/g, '');

  if (digits.length !== 14) {
    return res.status(400).json({ error: 'CNPJ deve conter exatamente 14 dígitos.' });
  }

  try {
    const upstream = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      {
        signal: AbortSignal.timeout(7000),
        headers: { Accept: 'application/json' },
      }
    );

    if (upstream.status === 404) {
      return res.status(404).json({ error: 'CNPJ não encontrado na Receita Federal.' });
    }
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Erro na consulta (HTTP ${upstream.status}).` });
    }

    const d = await upstream.json();

    return res.json({
      razao_social:      d.razao_social      || '',
      nome_fantasia:     d.nome_fantasia      || '',
      cep:               formatCEP(d.cep),
      logradouro:        d.logradouro         || '',
      numero:            d.numero             || '',
      bairro:            d.bairro             || '',
      cidade:            d.municipio          || '',
      uf:                d.uf                 || '',
      telefone:          formatPhone(d.ddd_telefone_1),
      email:             d.email              || '',
      regime_tributario: inferirRegime(d),
      situacao:          d.descricao_situacao_cadastral || '',
      porte:             d.porte              || '',
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(503).json({ error: 'API de CNPJ indisponível. Tente novamente.' });
    }
    console.error('[cnpj]', err.message);
    return res.status(500).json({ error: 'Erro interno ao consultar CNPJ.' });
  }
});

module.exports = router;
