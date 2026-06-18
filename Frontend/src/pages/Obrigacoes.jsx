import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/shared/StatusBadge';
import Pagination from '../components/shared/Pagination';
import Modal, { ModalActions } from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { FormField, Input, Select } from '../components/shared/FormField';

const PER_PAGE = 8;

// All valid status values (including atrasada for manual entry and filtering)
const STATUS_OPTIONS = [
  { value: 'pendente',     label: 'Pendente'      },
  { value: 'em_andamento', label: 'Em Andamento'  },
  { value: 'concluida',    label: 'Concluída'     },
  { value: 'atrasada',     label: 'Atrasada'      },
];

// Template obligations shown in the modal dropdown, synced with backend TEMPLATES
const TEMPLATES_REGIME = {
  'Simples Nacional': [
    'DAS', 'DAE', 'FGTS', 'eSocial', 'DCTFWeb',
  ],
  'Lucro Presumido': [
    'PIS', 'COFINS', 'ISS', 'ICMS', 'INSS', 'FGTS', 'DCTF', 'EFD-Contribuições',
  ],
  'Lucro Real': [
    'PIS', 'COFINS', 'IRPJ Mensal', 'CSLL Mensal',
    'ISS', 'ICMS', 'INSS', 'FGTS', 'DCTF', 'SPED Fiscal',
  ],
};

const EMPTY_FORM = { descricao: '', prazo: '', status: 'pendente', id_cliente: '', id_filial: '' };

// ── Date filter helpers (MM/AAAA mask + client-side match) ───────────────────
function mascaraMMAAAA(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function matchesMesAno(prazoISO, mmaaaa) {
  if (!mmaaaa || !/^\d{2}\/\d{4}$/.test(mmaaaa)) return true; // incomplete — no filter
  const [mm, yyyy] = mmaaaa.split('/');
  const mes = parseInt(mm, 10);
  const ano = parseInt(yyyy, 10);
  if (mes < 1 || mes > 12) return true; // invalid month — no filter
  const d = new Date(prazoISO);
  return d.getMonth() + 1 === mes && d.getFullYear() === ano;
}

// ── Parse the composite id_cliente value ("filial:ID" or plain numeric ID) ────
function parseSelection(idClienteValue, filiais, clientes) {
  const raw = String(idClienteValue);
  if (raw.startsWith('filial:')) {
    const filialId = parseInt(raw.split(':')[1], 10);
    const filial   = filiais.find((f) => f.id === filialId);
    const cliente  = clientes.find((c) => c.id === filial?.id_cliente);
    return { id_cliente: filial?.id_cliente ?? null, id_filial: filialId, cliente, filial };
  }
  const clienteId = parseInt(raw, 10);
  const cliente   = clientes.find((c) => c.id === clienteId);
  return { id_cliente: clienteId || null, id_filial: null, cliente, filial: null };
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function ObrigacaoModal({ open, onClose, form, onChange, onSubmit, loading, isEditing, clientes, filiais, modoTemplate, setModoTemplate }) {
  const { cliente: clienteSelecionado, id_filial: filialSelecionadaId } = parseSelection(form.id_cliente, filiais, clientes);
  const regime    = clienteSelecionado?.regime_tributario;
  const templates = regime ? TEMPLATES_REGIME[regime] || [] : [];

  // Secondary filial picker: only shown when a Matriz (plain client) is selected
  // and that client has filiais — lets the user pin the obligation to one filial.
  const isMatriz        = !String(form.id_cliente).startsWith('filial:') && !!parseInt(form.id_cliente, 10);
  const filiasFiltradas = isMatriz ? filiais.filter((f) => String(f.id_cliente) === String(form.id_cliente)) : [];

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar Obrigação' : 'Adicionar Obrigação'}>
      <form onSubmit={onSubmit}>

        {/* Empresa / Filial selector */}
        <FormField label="Selecionar Empresa" required>
          <Select
            value={form.id_cliente}
            onChange={(e) => { onChange('id_cliente', e.target.value); onChange('id_filial', ''); }}
            required
          >
            <option value="">Selecione uma empresa ou filial</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
            {filiais.map((f) => (
              <option key={`f-${f.id}`} value={`filial:${f.id}`}>{f.apelido || f.nome} (Filial)</option>
            ))}
          </Select>
        </FormField>

        {/* Regime badge */}
        {regime && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded mb-4">
            <span className="text-gray-400">ⓘ</span>
            Regime Detectado: <strong>{regime}</strong>
          </div>
        )}

        {/* Template / Manual toggle — shown for both Matriz and Filial when regime is known */}
        {!isEditing && templates.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setModoTemplate(true)}
              className={`py-2.5 text-sm font-semibold rounded transition ${modoTemplate ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Usar Template do Regime<br />
              <span className="text-[10px] font-normal">(Recomendado)</span>
            </button>
            <button
              type="button"
              onClick={() => setModoTemplate(false)}
              className={`py-2.5 text-sm font-semibold rounded transition ${!modoTemplate ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Criar Manualmente
            </button>
          </div>
        )}

        {/* Obligation description */}
        <FormField label="Obrigação" required>
          {modoTemplate && templates.length > 0 && !isEditing ? (
            <Select value={form.descricao} onChange={(e) => onChange('descricao', e.target.value)} required>
              <option value="">Selecione a obrigação</option>
              {templates.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          ) : (
            <Input
              value={form.descricao}
              onChange={(e) => onChange('descricao', e.target.value)}
              placeholder="Ex: DCTF"
              required
            />
          )}
        </FormField>

        {/* Secondary filial selector (only when a Matriz is chosen and it has filiais) */}
        {filiasFiltradas.length > 0 && (
          <FormField label="Filial (opcional)">
            <Select value={form.id_filial} onChange={(e) => onChange('id_filial', e.target.value)}>
              <option value="">Obrigação da empresa toda</option>
              {filiasFiltradas.map((f) => (
                <option key={f.id} value={f.id}>{f.apelido || f.nome}</option>
              ))}
            </Select>
          </FormField>
        )}

        {/* Filial indicator when a Filial was selected directly */}
        {filialSelecionadaId && !isMatriz && (
          <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded mb-4">
            Vinculada à Filial selecionada. O cliente será inferido automaticamente.
          </p>
        )}

        {/* Date + Status */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data de Vencimento" required>
            <Input
              type="date"
              value={form.prazo}
              onChange={(e) => onChange('prazo', e.target.value)}
              required
            />
          </FormField>
          <FormField label="Status">
            <div className="flex items-center gap-2">
              <Select value={form.status} onChange={(e) => onChange('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <StatusBadge status={form.status} />
            </div>
          </FormField>
        </div>

        <ModalActions onCancel={onClose} confirmLabel={isEditing ? 'Salvar' : 'Adicionar'} loading={loading} />
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Obrigacoes() {
  const [obrigacoes, setObrigacoes]     = useState([]);
  const [clientes, setClientes]         = useState([]);
  const [filiais, setFiliais]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroData, setFiltroData]     = useState(''); // MM/AAAA — client-side
  const [page, setPage]                 = useState(1);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [modoTemplate, setModoTemplate] = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [erro, setErro]                 = useState('');

  // Backend filters: text search + status
  const carregar = useCallback(() => {
    setLoading(true);
    const params = {};
    if (busca)        params.q      = busca;
    if (filtroStatus) params.status = filtroStatus;
    api.getObrigacoes(params)
      .then(setObrigacoes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [busca, filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    Promise.all([api.getClientes(), api.getFiliais()])
      .then(([c, f]) => { setClientes(c); setFiliais(f); })
      .catch(console.error);
  }, []);

  const abrirNovo = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModoTemplate(true);
    setErro('');
    setModalOpen(true);
  };

  const abrirEditar = (o) => {
    setEditing(o);
    setForm({
      descricao:  o.descricao,
      prazo:      o.prazo ? new Date(o.prazo).toISOString().slice(0, 10) : '',
      status:     o.status,
      // Encode as filial:ID when the obligation belongs to a filial
      id_cliente: o.id_filial ? `filial:${o.id_filial}` : String(o.id_cliente),
      id_filial:  '',
    });
    setModoTemplate(false);
    setErro('');
    setModalOpen(true);
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      // Resolve the composite id_cliente value into concrete IDs
      const { id_cliente, id_filial: parsedFilialId } = parseSelection(form.id_cliente, filiais, clientes);

      // If a Matriz was chosen + a secondary filial picker was used, honour that too
      const id_filial = parsedFilialId ?? (form.id_filial ? parseInt(form.id_filial, 10) : null);

      if (!id_cliente) throw new Error('Selecione uma empresa ou filial válida.');

      const payload = {
        descricao:  form.descricao,
        prazo:      form.prazo,
        status:     form.status,
        id_cliente,
        id_filial,
      };

      if (editing) await api.atualizarObrigacao(editing.id, payload);
      else         await api.criarObrigacao(payload);

      setModalOpen(false);
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
      await api.excluirObrigacao(deleteTarget.id);
      setDeleteTarget(null);
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Client-side date filter applied on top of backend results
  const obrigacoesFiltradas = obrigacoes.filter((o) => matchesMesAno(o.prazo, filtroData));
  const paginados = obrigacoesFiltradas.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-gray-900">Gestão de Obrigações</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie e acompanhe as obrigações fiscais dos seus clientes.</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-gray-800 transition"
        >
          + Nova Obrigação
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-[#fafaf9]">

          {/* Left — search */}
          <div className="relative w-full md:max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              placeholder="Buscar obrigação ou empresa..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Right — status + date, wraps on small screens */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">

            {/* Status dropdown */}
            <Select
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPage(1); }}
              className="w-full sm:w-40 text-sm"
            >
              <option value="">Status: Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>

            {/* MM/AAAA masked text input */}
            <div className="relative w-full sm:w-52">
              <input
                type="text"
                inputMode="numeric"
                value={filtroData}
                onChange={(e) => {
                  const masked = mascaraMMAAAA(e.target.value);
                  setFiltroData(masked);
                  setPage(1);
                }}
                placeholder="MM/AAAA"
                maxLength={7}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
              />
              {filtroData && (
                <button
                  onClick={() => { setFiltroData(''); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  title="Limpar filtro de data"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="text-left py-3 px-5 font-medium">Obrigação</th>
              <th className="text-left py-3 px-5 font-medium">Empresa</th>
              <th className="text-left py-3 px-5 font-medium">Prazo (Vencimento)</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
              <th className="text-left py-3 px-5 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Carregando...</td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Nenhuma obrigação encontrada.</td></tr>
            ) : (
              paginados.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="py-4 px-5 font-medium text-gray-900">{o.descricao}</td>
                  <td className="py-4 px-5 text-gray-600">{o.filial?.apelido || o.filial?.nome || o.cliente?.nome}</td>
                  <td className="py-4 px-5 text-gray-500 font-mono text-xs">
                    {new Date(o.prazo).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-5"><StatusBadge status={o.status} /></td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => abrirEditar(o)} className="text-gray-400 hover:text-gray-700 transition" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(o)} className="text-gray-400 hover:text-red-500 transition" title="Excluir">
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
          <Pagination total={obrigacoesFiltradas.length} page={page} perPage={PER_PAGE} onPage={setPage} />
        </div>
      </div>

      {/* Inline error toast */}
      {erro && modalOpen && (
        <p className="fixed bottom-4 right-4 text-xs text-red-600 bg-red-50 px-4 py-2 rounded shadow z-50">
          {erro}
        </p>
      )}

      <ObrigacaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={saving}
        isEditing={!!editing}
        clientes={clientes}
        filiais={filiais}
        modoTemplate={modoTemplate}
        setModoTemplate={setModoTemplate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Obrigação"
        message={`Tem certeza que deseja excluir a obrigação "${deleteTarget?.descricao}"?`}
      />
    </div>
  );
}
