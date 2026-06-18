const configs = {
  ativo:        { label: 'Ativo',        bg: 'bg-green-100',  text: 'text-green-700' },
  inativo:      { label: 'Inativo',      bg: 'bg-red-100',    text: 'text-red-600' },
  pendente:     { label: 'Pendente',     bg: 'bg-yellow-100', text: 'text-yellow-700' },
  em_andamento: { label: 'Em Andamento', bg: 'bg-blue-100',   text: 'text-blue-700' },
  concluida:    { label: 'Concluída',    bg: 'bg-green-100',  text: 'text-green-700' },
  atrasada:     { label: 'Atrasada',     bg: 'bg-red-100',    text: 'text-red-600' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
