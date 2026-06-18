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

const PER_PAGE = 8;

const EMPTY_FORM = {
  nome: '', id_cliente: '', cnpj: '', apelido: '', inscricao_estadual: '',
  inscricao_municipal: '', cep: '', logradouro: '', numero: '', bairro: '',
  cidade: '', uf: '', nome_fantasia: '', telefone: '', email: '', status: 'ativo',
};

// ── Form ─────────────────────────────────────────────────────────────────────

function FilialForm({ form, onChange, onBuscarCNPJ, cnpjLoading, onSubmit, loading, isEditing, clientes }) {
  return (
    <form onSubmit={onSubmit}>

      {/* Vincular ao Cliente */}
      <FormField label="Vincular ao Cliente" required>
        <Select
          value={form.id_cliente}
          onChange={(e) => onChange('id_cliente', e.target.value)}
          required
        >
          <option value="">Selecione um cliente</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
      </FormField>

      {/* CNPJ da Filial with lookup */}
      <FormField label="CNPJ da Filial">
        <CnpjInput
          value={form.cnpj}
          onChange={(v) => onChange('cnpj', v)}
          onSearch={onBuscarCNPJ}
          loading={cnpjLoading}
          disabled={isEditing}
        />
        <p className="text-[10px] text-gray-400 mt-1">
          {isEditing
            ? 'O CNPJ não pode ser alterado após o cadastro.'
            : 'Digite o CNPJ para preencher endereço e dados automaticamente.'}
        </p>
      </FormField>

      {/* Nome da Filial */}
      <FormField label="Nome da Filial" required>
        <Input
          value={form.nome}
          onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Filial 01 - SP"
          required
        />
      </FormField>

      {/* Apelido */}
      <FormField label="Apelido / Identificação">
        <Input
          value={form.apelido}
          onChange={(e) => onChange('apelido', e.target.value)}
          placeholder="Filial SP"
        />
      </FormField>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">Dados Fiscais</p>

      {/* Inscrições */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Inscrição Estadual">
          <Input value={form.inscricao_estadual} onChange={(e) => onChange('inscricao_estadual', e.target.value)} />
        </FormField>
        <FormField label="Inscrição Municipal">
          <Input value={form.inscricao_municipal} onChange={(e) => onChange('inscricao_municipal', e.target.value)} />
        </FormField>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">Endereço</p>

      {/* CEP */}
      <FormField label="CEP">
        <Input value={form.cep} onChange={(e) => onChange('cep', e.target.value)} placeholder="00000-000" />
      </FormField>

      {/* Logradouro + Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <FormField label="Logradouro">
            <Input value={form.logradouro} onChange={(e) => onChange('logradouro', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Número">
          <Input value={form.numero} onChange={(e) => onChange('numero', e.target.value)} />
        </FormField>
      </div>

      {/* Bairro */}
      <FormField label="Bairro">
        <Input value={form.bairro} onChange={(e) => onChange('bairro', e.target.value)} />
      </FormField>

      {/* Cidade + UF */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3">
          <FormField label="Cidade">
            <Input value={form.cidade} onChange={(e) => onChange('cidade', e.target.value)} />
          </FormField>
        </div>
        <FormField label="UF">
          <Input value={form.uf} onChange={(e) => onChange('uf', e.target.value)} maxLength={2} />
        </FormField>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">Contato</p>

      {/* Nome Fantasia */}
      <FormField label="Nome Fantasia">
        <Input value={form.nome_fantasia} onChange={(e) => onChange('nome_fantasia', e.target.value)} />
      </FormField>

      {/* Telefone + Email */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Telefone">
          <Input value={form.telefone} onChange={(e) => onChange('telefone', e.target.value)} placeholder="(XX) XXXXX-XXXX" />
        </FormField>
        <FormField label="E-mail">
          <Input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
        </FormField>
      </div>

      {/* Status */}
      <FormField label="Status">
        <div className="flex gap-5 mt-1">
          {['ativo', 'inativo'].map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="status_filial"
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
        confirmLabel={isEditing ? 'Salvar Alterações' : 'Salvar Filial'}
        loading={loading}
      />
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Filiais() {
  const [filiais, setFiliais]         = useState([]);
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
    api.getFiliais(busca ? { q: busca } : {})
      .then(setFiliais)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [busca]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    api.getClientes().then(setClientes).catch(console.error);
  }, []);

  const abrirNovo = () => { setEditing(null); setForm(EMPTY_FORM); setErro(''); setPanelOpen(true); };

  const abrirEditar = (f) => {
    setEditing(f);
    setForm({
      nome: f.nome || '', id_cliente: f.id_cliente || '', cnpj: f.cnpj || '',
      apelido: f.apelido || '', inscricao_estadual: f.inscricao_estadual || '',
      inscricao_municipal: f.inscricao_municipal || '', cep: f.cep || '',
      logradouro: f.logradouro || '', numero: f.numero || '', bairro: f.bairro || '',
      cidade: f.cidade || '', uf: f.uf || '', nome_fantasia: f.nome_fantasia || '',
      telefone: f.telefone || '', email: f.email || '', status: f.status || 'ativo',
    });
    setErro('');
    setPanelOpen(true);
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ── CNPJ lookup — populates address + contact fields ─────────────────────
  const handleBuscarCNPJ = useCallback(async (digits) => {
    setCnpjLoading(true);
    try {
      const data = await api.buscarCNPJ(digits);

      setForm((f) => ({
        ...f,
        cnpj:          formatCNPJ(digits),
        nome:          f.nome || data.razao_social,
        nome_fantasia: data.nome_fantasia || f.nome_fantasia,
        cep:           data.cep          || f.cep,
        logradouro:    data.logradouro   || f.logradouro,
        numero:        data.numero       || f.numero,
        bairro:        data.bairro       || f.bairro,
        cidade:        data.cidade       || f.cidade,
        uf:            data.uf           || f.uf,
        telefone:      data.telefone     || f.telefone,
        email:         data.email        || f.email,
      }));

      showToast('Endereço e dados preenchidos automaticamente.', 'success');
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
      const payload = { ...form, id_cliente: parseInt(form.id_cliente) };
      if (editing) await api.atualizarFilial(editing.id, payload);
      else         await api.criarFilial(payload);
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
      await api.excluirFilial(deleteTarget.id);
      setDeleteTarget(null);
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const paginados = filiais.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-gray-900">Gestão de Filiais</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas filiais com preenchimento automático de endereço via CNPJ.</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-gray-800 transition"
        >
          + Nova Filial
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {/* Filtro */}
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
              <th className="text-left py-3 px-5 font-medium">Apelido / Identificação</th>
              <th className="text-left py-3 px-5 font-medium">Empresa Matriz</th>
              <th className="text-left py-3 px-5 font-medium">Status</th>
              <th className="text-left py-3 px-5 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Carregando...</td></tr>
            ) : paginados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Nenhuma filial encontrada.</td></tr>
            ) : (
              paginados.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="py-4 px-5 text-gray-600 font-mono text-xs">{f.cnpj || '—'}</td>
                  <td className="py-4 px-5 font-medium text-gray-900">{f.apelido || f.nome}</td>
                  <td className="py-4 px-5 text-gray-600">{f.cliente?.nome}</td>
                  <td className="py-4 px-5"><StatusBadge status={f.status} /></td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => abrirEditar(f)} className="text-gray-400 hover:text-gray-700 transition" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(f)} className="text-gray-400 hover:text-red-500 transition" title="Excluir">
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
          <Pagination total={filiais.length} page={page} perPage={PER_PAGE} onPage={setPage} />
        </div>
      </div>

      {/* Slide Panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={editing ? 'Editar Filial' : 'Registrar Nova Filial'}>
        {erro && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded">{erro}</p>}
        <FilialForm
          form={form}
          onChange={handleChange}
          onBuscarCNPJ={handleBuscarCNPJ}
          cnpjLoading={cnpjLoading}
          onSubmit={handleSubmit}
          loading={saving}
          isEditing={!!editing}
          clientes={clientes}
        />
      </SlidePanel>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Filial"
        message={`Tem certeza que deseja excluir "${deleteTarget?.apelido || deleteTarget?.nome}"?`}
      />

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  );
}
