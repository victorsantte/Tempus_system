import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'DASHBOARD' },
  { to: '/clientes', label: 'CLIENTES' },
  { to: '/filiais', label: 'FILIAIS' },
  { to: '/obrigacoes', label: 'OBRIGAÇÕES' },
];

export default function Layout({ children }) {
  const { usuario, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#f5f0e9] font-sans">
      {/* Sidebar */}
      <aside className="w-44 flex flex-col justify-between py-8 px-5 bg-[#f5f0e9] border-r border-gray-200 shrink-0">
        <div>
          <h1 className="text-2xl font-serif mb-10 tracking-tight">Tempus</h1>
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-xs font-semibold tracking-widest py-2 px-3 rounded transition-colors ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-xs font-semibold tracking-widest py-2 px-3 rounded transition-colors mt-4 ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                PAINEL DO
                <br />
                ADMINISTRADOR
              </NavLink>
            )}
          </nav>
        </div>

        {/* User info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-800 truncate max-w-[80px]">{usuario?.nome}</p>
              <p className="text-[10px] text-gray-500 capitalize">{usuario?.perfil}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 text-[10px] text-gray-400 hover:text-gray-700 tracking-wider uppercase"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-end px-8 py-4 border-b border-gray-200 bg-[#f5f0e9]">
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {isAdmin && (
              <span className="text-xs text-gray-500">{usuario?.nome} · Administrador</span>
            )}
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
