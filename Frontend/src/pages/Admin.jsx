import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import Modal, { ModalActions } from '../components/shared/Modal';
import { FormField, Input, Select } from '../components/shared/FormField';

const NIVEIS = ['contador', 'auxiliar', 'administrador'];

const PERMISSOES_PADRAO = {
  clientes:   { adicionar: false, editar: false, excluir: false },
  filiais:    { adicionar: false, editar: false, excluir: false },
  obrigacoes: { atribuir: false, concluir: false, excluir: false },
};

// ── Service Health Card ────────────────────────────────────────────────────────
function ServiceCard({ service }) {
  if (!service) return null;

  const online = service.status === 'online';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="font-medium text-sm text-gray-800">{service.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {service.detail || (online ? 'Operacional' : 'Indisponível')}
        </p>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${online ? 'text-green-600' : 'text-red-500'}`}>
        <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
        {online ? 'ONLINE' : 'OFFLINE'}
      </div>
    </div>
  );
}

// ── Permissions Modal ──────────────────────────────────────────────────────────
function PermissoesModal({ open, onClose, usuario, onSave }) {
  const [perms, setPerms] = useState(PERMISSOES_PADRAO);
  const [acessoTotal, setAcessoTotal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (usuario) {
      setPerms({ ...PERMISSOES_PADRAO, ...(usuario.permissoes || {}) });
      setAcessoTotal(!!usuario.acessoTotal);
    }
  }, [usuario]);

  const toggle = (modulo, acao) =>
    setPerms((p) => ({ ...p, [modulo]: { ...p[modulo], [acao]: !p[modulo][acao] } }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(usuario.id, { permissoes: perms }); onClose(); }
    finally { setSaving(false); }
  };

  const CheckRow = ({ label, modulo, acao }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox"
        checked={acessoTotal || perms[modulo]?.[acao] || false}
        onChange={() => toggle(modulo, acao)}
        disabled={acessoTotal}
        className="accent-black w-3.5 h-3.5" />
      {label}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title="Configurar Permissões" size="lg">
      <p className="text-sm text-gray-500 mb-5">
        Editando permissões para: <strong>{usuario?.nome}</strong>
      </p>
      <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-4 py-3 mb-6 cursor-pointer">
        <input type="checkbox" checked={acessoTotal} onChange={(e) => setAcessoTotal(e.target.checked)} className="accent-black w-4 h-4" />
        <span className="text-sm font-medium">Garantir Acesso Total</span>
      </label>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Clientes (Matriz)</p>
          <div className="space-y-2.5">
            <CheckRow label="Adicionar" modulo="clientes" acao="adicionar" />
            <CheckRow label="Editar"    modulo="clientes" acao="editar" />
            <CheckRow label="Excluir"   modulo="clientes" acao="excluir" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filiais</p>
          <div className="space-y-2.5">
            <CheckRow label="Adicionar" modulo="filiais" acao="adicionar" />
            <CheckRow label="Editar"    modulo="filiais" acao="editar" />
            <CheckRow label="Excluir"   modulo="filiais" acao="excluir" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Obrigações</p>
          <div className="space-y-2.5">
            <CheckRow label="Atribuir Nova"          modulo="obrigacoes" acao="atribuir" />
            <CheckRow label="Marcar como Concluída"  modulo="obrigacoes" acao="concluir" />
            <CheckRow label="Excluir"                modulo="obrigacoes" acao="excluir" />
          </div>
        </div>
      </div>
      <ModalActions onCancel={onClose} onConfirm={handleSave} confirmLabel="Salvar Permissões" loading={saving} />
    </Modal>
  );
}

// ── New / Edit User Modal ──────────────────────────────────────────────────────
function NovoUsuarioModal({ open, onClose, onSave, editingUser }) {
  const [form, setForm]     = useState({ nome: '', email: '', senha: '', perfil: 'contador' });
  const [perms, setPerms]   = useState(PERMISSOES_PADRAO);
  const [acessoTotal, setAcessoTotal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro]     = useState('');

  useEffect(() => {
    if (editingUser) {
      setForm({ nome: editingUser.nome, email: editingUser.email, senha: '', perfil: editingUser.perfil });
      setPerms(editingUser.permissoes || PERMISSOES_PADRAO);
    } else {
      setForm({ nome: '', email: '', senha: '', perfil: 'contador' });
      setPerms(PERMISSOES_PADRAO);
      setAcessoTotal(false);
    }
    setErro('');
  }, [editingUser, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try { await onSave({ ...form, permissoes: perms }); onClose(); }
    catch (err) { setErro(err.message); }
    finally { setSaving(false); }
  };

  const CheckRow = ({ label, modulo, acao }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox"
        checked={acessoTotal || perms[modulo]?.[acao] || false}
        onChange={() => setPerms((p) => ({ ...p, [modulo]: { ...p[modulo], [acao]: !p[modulo][acao] } }))}
        disabled={acessoTotal}
        className="accent-black w-3.5 h-3.5" />
      {label}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title={editingUser ? 'Editar Usuário' : 'Configurar Novo Usuário'} size="lg">
      <form onSubmit={handleSubmit}>
        {erro && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded">{erro}</p>}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="Nome" required>
            <Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" required />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@empresa.com" required />
          </FormField>
        </div>
        {!editingUser && (
          <FormField label="Senha" required>
            <Input type="password" value={form.senha} onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))} required />
          </FormField>
        )}
        <FormField label="Nível de Acesso">
          <Select value={form.perfil} onChange={(e) => setForm(f => ({ ...f, perfil: e.target.value }))}>
            {NIVEIS.map((n) => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
          </Select>
        </FormField>
        <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-4 py-3 mb-5 cursor-pointer">
          <input type="checkbox" checked={acessoTotal} onChange={(e) => setAcessoTotal(e.target.checked)} className="accent-black w-4 h-4" />
          <span className="text-sm font-medium">Garantir Acesso Total</span>
        </label>
        <p className="text-sm font-medium text-gray-700 mb-3">Permissões Específicas</p>
        <div className="grid grid-cols-3 gap-6 mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Clientes (Matriz)</p>
            <div className="space-y-2">
              <CheckRow label="Adicionar" modulo="clientes" acao="adicionar" />
              <CheckRow label="Editar"    modulo="clientes" acao="editar" />
              <CheckRow label="Excluir"   modulo="clientes" acao="excluir" />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Filiais</p>
            <div className="space-y-2">
              <CheckRow label="Adicionar" modulo="filiais" acao="adicionar" />
              <CheckRow label="Editar"    modulo="filiais" acao="editar" />
              <CheckRow label="Excluir"   modulo="filiais" acao="excluir" />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Obrigações</p>
            <div className="space-y-2">
              <CheckRow label="Atribuir Nova"         modulo="obrigacoes" acao="atribuir" />
              <CheckRow label="Marcar como Concluída" modulo="obrigacoes" acao="concluir" />
              <CheckRow label="Excluir"               modulo="obrigacoes" acao="excluir" />
            </div>
          </div>
        </div>
        <ModalActions onCancel={onClose} confirmLabel={editingUser ? 'Salvar' : 'Salvar Novo'} loading={saving} />
      </form>
    </Modal>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000;

export default function Admin() {
  const [usuarios,     setUsuarios]     = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [services,     setServices]     = useState(null);
  const [loadingHealth,setLoadingHealth]= useState(true);
  const [lastChecked,  setLastChecked]  = useState(null);
  const [novoModal,    setNovoModal]    = useState(false);
  const [permModal,    setPermModal]    = useState(null);
  const [editingUser,  setEditingUser]  = useState(null);

  const carregarUsuarios = useCallback(() => {
    setLoadingUsers(true);
    api.getUsuarios()
      .then(setUsuarios)
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  const carregarHealth = useCallback(() => {
    setLoadingHealth(true);
    api.getHealthServices()
      .then((data) => {
        setServices(data.services);
        setLastChecked(new Date());
      })
      .catch(() => {
        // If the health endpoint itself is unreachable, mark all offline
        setServices({
          auth:           { name: 'API de Autenticação',       status: 'offline', detail: 'Sem resposta do servidor' },
          database:       { name: 'Banco de Dados (PostgreSQL)', status: 'offline', detail: 'Sem resposta do servidor' },
          templates:      { name: 'API de Templates Internos', status: 'offline', detail: 'Sem resposta do servidor' },
          receitaFederal: { name: 'API Receita Federal (CNPJ)', status: 'offline', detail: 'Sem resposta do servidor' },
        });
        setLastChecked(new Date());
      })
      .finally(() => setLoadingHealth(false));
  }, []);

  useEffect(() => {
    carregarUsuarios();
    carregarHealth();

    // Auto-refresh health every 30 seconds
    const interval = setInterval(carregarHealth, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [carregarUsuarios, carregarHealth]);

  const handleSalvarNovo = async (data) => {
    if (editingUser) await api.atualizarUsuario(editingUser.id, data);
    else             await api.criarUsuario(data);
    carregarUsuarios();
  };

  const handleSalvarPermissoes = async (id, data) => {
    await api.atualizarUsuario(id, data);
    carregarUsuarios();
  };

  const roleBadge = (perfil) => {
    const cfg = {
      administrador: 'bg-purple-100 text-purple-700',
      contador:      'bg-blue-100   text-blue-700',
      auxiliar:      'bg-gray-100   text-gray-600',
    };
    return cfg[perfil] || 'bg-gray-100 text-gray-600';
  };

  const serviceList = services
    ? [services.auth, services.database, services.templates, services.receitaFederal]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-serif text-gray-900">Painel do Administrador</h2>
          <p className="text-sm text-gray-500 mt-2">Supervisão de sistemas e controle de acesso.</p>
        </div>
        {lastChecked && (
          <p className="text-xs text-gray-400">
            Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
            <button onClick={carregarHealth} className="ml-3 text-gray-500 hover:text-gray-800 underline">
              Atualizar
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Service monitoring */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-4">Monitoramento de Serviços</h3>
          {loadingHealth ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {serviceList.map((svc) => svc && <ServiceCard key={svc.name} service={svc} />)}
            </div>
          )}
        </div>

        {/* User management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Gerenciamento de Usuários</h3>
            <button
              onClick={() => { setEditingUser(null); setNovoModal(true); }}
              className="flex items-center gap-2 bg-black text-white text-xs font-semibold px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              + Novo Usuário
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Nível</th>
                  <th className="text-left py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">Carregando...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">Nenhum usuário cadastrado.</td></tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-900">{u.nome}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${roleBadge(u.perfil)}`}>
                          {u.perfil.charAt(0).toUpperCase() + u.perfil.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setPermModal(u)}
                          title="Configurar permissões"
                          className="text-gray-400 hover:text-gray-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NovoUsuarioModal
        open={novoModal}
        onClose={() => setNovoModal(false)}
        onSave={handleSalvarNovo}
        editingUser={editingUser}
      />
      <PermissoesModal
        open={!!permModal}
        onClose={() => setPermModal(null)}
        usuario={permModal}
        onSave={handleSalvarPermissoes}
      />
    </div>
  );
}
