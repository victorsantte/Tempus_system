const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// ── Token helpers ────────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('tempus_token');
}

// ── Core request helper ──────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    // Network-level failure: backend offline, CORS preflight blocked, or DNS error
    const err = new Error('Não foi possível conectar ao servidor. Verifique se o Backend está rodando em http://localhost:3000.');
    err.status = 0;
    err.code   = 'NETWORK_ERROR';
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status} na requisição.`);
    err.status = res.status;
    err.code   = data.code;
    throw err;
  }

  return data;
}

// ── Public API surface ───────────────────────────────────────────────────────
export const api = {

  // ── Auth ───────────────────────────────────────────────────────────────────
  login:         (email, senha)       => request('/api/auth/login',          { method: 'POST', body: JSON.stringify({ email, senha }) }),
  me:            ()                   => request('/api/auth/me'),
  resetPassword: (email)              => request('/api/auth/reset-password',  { method: 'POST', body: JSON.stringify({ email }) }),
  confirmReset:  (token, novaSenha)   => request('/api/auth/confirm-reset',   { method: 'POST', body: JSON.stringify({ token, novaSenha }) }),

  // ── CNPJ Lookup ────────────────────────────────────────────────────────────
  /**
   * Consulta dados de uma empresa na BrasilAPI via proxy backend.
   * @param {string} cnpj — 14 dígitos (sem formatação)
   * @returns {{ razao_social, nome_fantasia, cep, logradouro, numero, bairro, cidade, uf, telefone, email, regime_tributario, situacao, porte }}
   */
  buscarCNPJ: (cnpj) => request(`/api/cnpj/${cnpj.replace(/\D/g, '')}`),

  // ── Health ─────────────────────────────────────────────────────────────────
  /** Basic ping — no auth required. Returns { status, uptime, timestamp }. */
  getHealth: () => request('/api/health'),

  /**
   * Full services status with live latency measurements.
   * Returns { services: { auth, database, templates, receitaFederal } }.
   */
  getHealthServices: () => request('/api/health/services'),

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: () => request('/api/dashboard/stats'),

  // ── Clientes ───────────────────────────────────────────────────────────────
  getClientes:      (params = {}) => request('/api/clientes?' + new URLSearchParams(params)),
  getCliente:       (id)          => request(`/api/clientes/${id}`),
  criarCliente:     (data)        => request('/api/clientes',     { method: 'POST', body: JSON.stringify(data) }),
  atualizarCliente: (id, data)    => request(`/api/clientes/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  excluirCliente:   (id)          => request(`/api/clientes/${id}`, { method: 'DELETE' }),

  // ── Filiais ────────────────────────────────────────────────────────────────
  getFiliais:      (params = {}) => request('/api/filiais?' + new URLSearchParams(params)),
  getFilial:       (id)          => request(`/api/filiais/${id}`),
  criarFilial:     (data)        => request('/api/filiais',      { method: 'POST', body: JSON.stringify(data) }),
  atualizarFilial: (id, data)    => request(`/api/filiais/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  excluirFilial:   (id)          => request(`/api/filiais/${id}`, { method: 'DELETE' }),

  // ── Obrigações ─────────────────────────────────────────────────────────────
  getObrigacoes:      (params = {}) => request('/api/obrigacoes?' + new URLSearchParams(params)),
  getObrigacao:       (id)          => request(`/api/obrigacoes/${id}`),
  criarObrigacao:     (data)        => request('/api/obrigacoes',      { method: 'POST', body: JSON.stringify(data) }),
  atualizarObrigacao: (id, data)    => request(`/api/obrigacoes/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  excluirObrigacao:   (id)          => request(`/api/obrigacoes/${id}`, { method: 'DELETE' }),

  /**
   * Motor de Templates — gera as obrigações mensais fixas com base no regime do cliente.
   * @param {number} clienteId
   * @returns {{ message, regime, mes, obrigacoes[] }}
   */
  gerarTemplate: (clienteId) =>
    request('/api/obrigacoes/gerar-template', { method: 'POST', body: JSON.stringify({ cliente_id: clienteId }) }),

  // ── Admin / Usuários ───────────────────────────────────────────────────────
  getUsuarios:      ()         => request('/api/admin/usuarios'),
  criarUsuario:     (data)     => request('/api/admin/usuarios',      { method: 'POST', body: JSON.stringify(data) }),
  atualizarUsuario: (id, data) => request(`/api/admin/usuarios/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  excluirUsuario:   (id)       => request(`/api/admin/usuarios/${id}`, { method: 'DELETE' }),
};
