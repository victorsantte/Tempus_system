import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, LabelList, ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import StatusBadge from '../components/shared/StatusBadge';

const STATUS_COLORS = {
  pendente:     '#c9b86a',
  em_andamento: '#6b87a8',
  concluida:    '#7c9e8a',
  atrasada:     '#b87272',
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-6 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-4xl font-light text-gray-900">{value ?? '—'}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg opacity-50 ${color}`} />
    </div>
  );
}

// ── Custom X-axis tick — shows label on one line, count on the next ───────────
function CustomTick({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={10}>
        {payload.value}
      </text>
    </g>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Carregando dashboard…
      </div>
    );
  }

  const { stats, filaDeFoco, demandas } = data || {};

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-serif text-center mb-8 text-gray-700">Visão Geral</h2>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Em Andamento" value={stats?.emAndamento} color="bg-blue-200"   />
        <StatCard label="Pendentes"    value={stats?.pendentes}   color="bg-yellow-200" />
        <StatCard label="Atrasadas"    value={stats?.atrasadas}   color="bg-red-200"    />
        <StatCard label="Concluídas"   value={stats?.concluidas}  color="bg-green-200"  />
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Fila de Foco ─────────────────────────────────────────────────── */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Fila de Foco (Prazos Urgentes)</h3>
            <button
              onClick={() => navigate('/obrigacoes')}
              className="text-xs text-gray-400 hover:text-gray-700 uppercase tracking-wider transition"
            >
              Ver todos →
            </button>
          </div>

          {!filaDeFoco?.length ? (
            <p className="text-sm text-gray-400 py-4">Nenhuma obrigação pendente no momento.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Obrigação</th>
                  <th className="text-left pb-2 font-medium">Cliente</th>
                  <th className="text-left pb-2 font-medium">Prazo</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filaDeFoco.map((o) => {
                  const prazo    = new Date(o.prazo);
                  const hoje     = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const atrasada = prazo < hoje && o.status === 'pendente';

                  return (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-medium text-gray-800">{o.descricao}</td>
                      <td className="py-3 text-gray-600">
                        {o.filial?.apelido || o.filial?.nome || o.cliente?.nome}
                      </td>
                      <td className={`py-3 text-sm font-mono ${atrasada ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                        {prazo.toLocaleDateString('pt-BR')}
                        {atrasada && <span className="ml-1 text-[10px] font-sans font-normal bg-red-100 text-red-500 px-1.5 py-0.5 rounded">Atrasada</span>}
                      </td>
                      <td className="py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Demandas chart ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5">Demandas</h3>

          {demandas?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={demandas}
                margin={{ top: 20, right: 8, left: -24, bottom: 0 }}
                barCategoryGap="35%"
              >
                {/* X-axis shows the status label; no date */}
                <XAxis
                  dataKey="label"
                  tick={<CustomTick />}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#d1d5db' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  formatter={(v, _name, props) => [v, props.payload.label]}
                  labelFormatter={() => ''}
                />

                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {/* Count label on top of each bar */}
                  <LabelList
                    dataKey="quantidade"
                    position="top"
                    style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
                  />
                  {/* Individual colour per status */}
                  {demandas.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={STATUS_COLORS[entry.key] ?? '#a1a1aa'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400">Sem dados para exibir.</p>
          )}

          {/* Colour legend */}
          {demandas?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {demandas.map((d) => (
                <span key={d.key} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm"
                    style={{ background: STATUS_COLORS[d.key] ?? '#a1a1aa' }}
                  />
                  {d.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
