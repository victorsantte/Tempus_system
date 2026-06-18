import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './login.css';

// Bento tiles with their explicit CSS grid class
const TILES = [
  'PIS', 'COFINS', 'DCTF', 'ICMS',
  'INSS', 'FGTS', 'ISS', 'SPED', 'IRPJ',
];

export default function Login() {
  const [email, setEmail]     = useState('');
  const [senha, setSenha]     = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch (err) {
      setErro(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — warm background + bento tiles ───────────────────── */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center p-12"
        style={{ background: '#EDE8E2' }}
      >
        <div className="bento-grid">
          {TILES.map((name) => (
            <div key={name} className={`bento-tile tile-${name}`}>
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — clean white form ───────────────────────────────── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8 md:px-20 bg-white">
        <div className="w-full max-w-sm">

          {/* Brand */}
          <h1
            className="mb-6 text-gray-900 select-none"
            style={{ fontFamily: 'Georgia, Cambria, serif', fontSize: '56px', fontWeight: 400, lineHeight: 1.1 }}
          >
            Tempus
          </h1>

          {/* Heading */}
          <h2 className="text-2xl font-normal text-gray-800 mb-1 tracking-tight">
            Bem-vindo!
          </h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            Insira suas credenciais para acessar o sistema.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>

            {/* E-mail */}
            <label
              htmlFor="email"
              className="block mb-1.5 text-gray-500"
              style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em' }}
            >
              E-MAIL
            </label>
            <input
              id="email"
              type="email"
              placeholder="contador@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input mb-4"
              required
              disabled={loading}
            />

            {/* Senha */}
            <label
              htmlFor="senha"
              className="block mb-1.5 text-gray-500"
              style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em' }}
            >
              SENHA
            </label>
            <input
              id="senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="login-input mb-2"
              required
              disabled={loading}
            />

            {/* Error */}
            {erro && (
              <p className="text-xs text-red-500 mb-3 mt-1">{erro}</p>
            )}

            {/* Forgot password */}
            <div className="mb-7 mt-2">
              <Link
                to="/redefinir-senha"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                style={{ letterSpacing: '0.01em' }}
              >
                Esqueci minha senha
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'ENTRANDO…' : 'ENTRAR →'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-300 text-center" style={{ letterSpacing: '0.02em' }}>
              © 2024 Tempus Tecnologia. Acesso restrito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
