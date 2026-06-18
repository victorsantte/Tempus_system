import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/shared/StatusBadge';
import Pagination from '../components/shared/Pagination';
import SlidePanel, { PanelActions } from '../components/shared/SlidePanel';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { FormField, Input, Select } from '../components/shared/FormField';
import CnpjInput, { formatCNPJ } from '../components/shared/CnpjInput';
import Toast from '../components/shared/Toast';
import useToast from '../hooks/useToast';

const MES_ATUAL = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

// ── Motor de Templates section (shown only when editing an existing client) ──
function MotorTemplates({ cliente, onGerado, showToast }) {
  const [loading, setLoading]       = useState(false);
  const [resultado, setResultado]   = useState(null); // { obrigacoes, mes, regime }
  const [erroLocal, setErroLocal]   = useState('');

  const handleGerar = async () => {
    setLoading(true);
    setErroLocal('');
    setResultado(null);
    try {
      const data = await api.gerarTemplate(cliente.id);
      setResultado(data);
      showToast(`${data.obrigacoes.length} obrigação(ões) gerada(s) com sucesso!`, 'success');
      if (onGerado) onGerado();
    } catch (err) {
      const msg = err.message || 'Erro ao gerar obrigações.';
      setErroLocal(msg);
      showToast(msg, err.status === 409 ? 'info' : 'error');
    } finally {
      setLoading(false);
    }
  };

  const temRegime = !!cliente?.regime_tributario;

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Motor de Templates</p>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Gera automaticamente as obrigações fixas mensais com base no regime tributário do cliente.
      </p>

      {/* Regime badge */}
      {temRegime ? (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-xs text-amber-700">
            Regime: <strong>{cliente.regime_tributario}</strong> · Mês: <strong className="capitalize">{MES_ATUAL}</strong>
          </p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
          <p className="text-xs text-red-600">Defina o <strong>Regime Tributário</strong> acima para habilitar a geração automática.</p>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGerar}
        disabled={!temRegime || loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold transition ${
          temRegime && !loading
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Gerando…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Gerar Obrigações de {MES_ATUAL.charAt(0).toUpperCase() + MES_ATUAL.slice(1)}
          </>
        )}
      </button>

      {/* Error */}
      {erroLocal && !resultado && (
        <p className="text-xs text-red-500 mt-3 bg-red-50 px-3 py-2 rounded">{erroLocal}</p>
      )}

      {/* Success — inline obligation list */}
      {resultado && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-green-700 mb-2">
            ✓ {resultado.obrigacoes.length} obrigação(ões) criada(s):
          </p>
          <ul className="space-y-1">
            {resultado.obrigacoes.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between bg-green-50 border border-green-100 rounded px-3 py-2"
              >
                <span className="text-xs font-medium text-green-900">{o.descricao}</span>
                <span className="text-[10px] text-green-600 font-mono">
                  {new Date(o.prazo).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const PER_PAGE = 8;

const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Lucro Arbitrado'];

const EMPTY_FORM = {
  nome: '', cnpj: '', nome_fantasia: '', inscricao_estadual: '',
  telefone: '', email: '', regime_tributario: '', status: 'ativo',
};

// ── Form ─────────────────────────────────────────────────────────────────────

function ClienteForm({ form, onChange, onBuscarCNPJ, cnpjLoading, onSubmit, loading, isEditing, clienteAtual, onGerado, showToast }) {
  return (
    <form onSubmit={onSubmit}>

      {/* CNPJ with lookup */}
      <FormField label="CNPJ (Matriz)" required>
        <CnpjInput
          value={form.cnpj}
          onChange={(v) => onChange('cnpj', v)}
          onSearch={onBuscarCNPJ}
          loading={cnpjLoading}
          disabled={isEditing}
        />
        {isEditing && (
          <p className="text-[10px] text-gray-400 mt-1">O CNPJ não pode ser alterado após o cadastro.</p>
        )}
      </FormField>

      {/* Razão Social */}
      <FormField label="Razão Social" required>
        <Input
          value={form.nome}
          onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Empresa Exemplo S.A."
          required
        />
      </FormField>

      {/* Nome Fantasia */}
      <FormField label="Nome Fantasia">
        <Input
          value={form.nome_fantasia}
          onChange={(e) => onChange('nome_fantasia', e.target.value)}
          placeholder="Exemplo Fantasia"
        />
      </FormField>

      {/* Inscrição Estadual */}
      <FormField label="Inscrição Estadual">
        <Input
          value={form.inscricao_estadual}
          onChange={(e) => onChange('inscricao_estadual', e.target.value)}
          placeholder="Isento ou Número"
        />
      </FormField>

      {/* Telefone + Email */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Telefone">
          <Input
            value={form.telefone}
            onChange={(e) => onChange('telefone', e.target.value)}
            placeholder="(XX) XXXX-XXXX"
          />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="contato@empresa.com"
          />
        </FormField>
      </div>

      {/* Regime Tributário — always shown; pre-selected when inferred from CNPJ API */}
      <FormField label="Regime Tributário">
        <Select
          value={form.regime_tributario}
          onChange={(e) => onChange('regime_tributario', e.target.value)}
        >
          <option value="">Selecione o regime...</option>
          {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        {!form.regime_tributario && (
          <p className="text-[10px] text-amber-500 mt-1">
            Não foi possível determinar automaticamente. Selecione manualmente.
          </p>
        )}
      </FormField>

      {/* Status */}
      <FormField label="Status Inicial">
        <div className="flex gap-5 mt-1">
          {['ativo', 'inativo'].map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                checked={form.status === s}
                onChange={() => onChange('status', s)}
                className="accent-black"
              />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
      </FormField>

      <PanelActions
        onCancel={undefined}
        confirmLabel={isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}
        loading={loading}
      />

      {/* Motor de Templates — only for existing clients */}
      {isEditing && clienteAtual && (
        <MotorTemplates
          cliente={{ ...clienteAtual, regime_tributario: form.regime_tributario || clienteAtual.regime_tributario }}
          onGerado={onGerado}
          showToast={showToast}
        />
      )}
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes, setClientes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busca, setBusca]             = useState('');
  const [page, setPage]               = useState(1);
  const [panelOpen, setPanelOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [erro, setErro]               = useState('');
  const { toast, showToast, hideToast } = useToast();

  const carregar = useCallback(() => {
    setLoading(true);
    api.getClientes(busca ? { q: busca } : {})
      .then(setClientes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [busca]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErro('');
    setPanelOpen(true);
  };

  const abrirEditar = (c) => {
    setEditing(c);
    setForm({
      nome: c.nome || '', cnpj: c.cnpj || '', nome_fantasia: c.nome_fantasia || '',
      inscricao_estadual: c.inscricao_estadual || '', telefone: c.telefone || '',
      email: c.email || '', regime_tributario: c.regime_tributario || '', status: c.status || 'ativo',
    });
    setErro('');
    setPanelOpen(true);
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ── CNPJ lookup ────────────────────────────────────────────────────────────
  const handleBuscarCNPJ = useCallback(async (digits) => {
    setCnpjLoading(true);
    try {
      const data = await api.buscarCNPJ(digits);

      // Pre-fill editable fields; user can override any of them
      setForm((f) => ({
        ...f,
        cnpj:             formatCNPJ(digits),
        nome:             data.razao_social  || f.nome,
        nome_fantasia:    data.nome_fantasia || f.nome_fantasia,
        telefone:         data.telefone      || f.telefone,
        email:            data.email         || f.email,
        regime_tributario: data.regime_tributario || f.regime_tributario,
      }));

      showToast(
        data.regime_tributario
          ? `Dados preenchidos — ${data.regime_tributario}`
          : 'Dados preenchidos. Selecione o regime tributário.',
        'success'
      );
    } catch (err) {
      showToast(
        err.status === 404
          ? 'CNPJ não encontrado na Receita Federal.'
          : 'CNPJ não encontrado ou API indisponível.',
        'error'
      );
    } finally {
      setCnpjLoading(false);
    }
  }, [showToast]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      // CNPJ is already stored formatted (XX.XXX.XXX/XXXX-XX) — send as-is
      if (editing) {
        await api.atualizarCliente(editing.id, form);
      } else {
        await api.criarCliente(form);
      }
      setPanelOpen(false);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.excluirCliente(deleteTarget.id);
      setDeleteTarget(null);
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const paginados = clientes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-gray-900">Gestão de Clientes</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus clientes, filiais e obrigações fiscais de forma centralizada.</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-gray-800 transition"
        >
          + Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {/* Filtros */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded bg-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Tabela */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="text-left py-3 px-5 font-medium">CNPJ</th>
              <th className="text-left py-3 px-5 font-medium">Razão Social</th>
              <th className="text-left py-3 px-5 font-medium">Regime</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
              <th className="text-left py-3 px-5 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Carregando...</td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Nenhum cliente encontrado.</td></tr>
            ) : (
              paginados.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="py-4 px-5 text-gray-600 font-mono text-xs">{c.cnpj}</td>
                  <td className="py-4 px-5">
                    <p className="font-medium text-gray-900">{c.nome}</p>
                    {c.nome_fantasia && <p className="text-xs text-gray-400">{c.nome_fantasia}</p>}
                  </td>
                  <td className="py-4 px-5 text-gray-500 text-xs">{c.regime_tributario || '—'}</td>
                  <td className="py-4 px-5"><StatusBadge status={c.status} /></td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => abrirEditar(c)} className="text-gray-400 hover:text-gray-700 transition" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="text-gray-400 hover:text-red-500 transition" title="Excluir">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-5">
          <Pagination total={clientes.length} page={page} perPage={PER_PAGE} onPage={setPage} />
        </div>
      </div>

      {/* Slide Panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Editar Cliente' : 'Registrar Novo Cliente'}>
        {erro && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded">{erro}</p>}
        <ClienteForm
          form={form}
          onChange={handleChange}
          onBuscarCNPJ={handleBuscarCNPJ}
          cnpjLoading={cnpjLoading}
          onSubmit={handleSubmit}
          loading={saving}
          isEditing={!!editing}
          clienteAtual={editing}
          onGerado={carregar}
          showToast={showToast}
        />
      </SlidePanel>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
      />

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  );
}
