import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const TILES = ['PIS', 'ICMS', 'INSS', 'COFINS', 'FGTS', 'DCTF', 'ISS', 'SPED', 'IRPJ'];

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await api.resetPassword(email);
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Esquerda: tiles */}
      <div className="w-1/2 bg-[#f0ece4] flex flex-wrap content-center justify-center gap-4 p-12">
        {TILES.map((t) => (
          <div key={t} className="bg-[#e5e0d8] rounded-xl flex items-center justify-center text-sm font-light text-gray-500 tracking-widest"
            style={{ width: t.length > 3 ? 140 : 110, height: t.length > 3 ? 100 : 90 }}>
            {t}
          </div>
        ))}
      </div>

      {/* Direita: formulário */}
      <div className="w-1/2 flex flex-col justify-center px-20 bg-white">
        <p className="text-sm font-semibold tracking-wider text-gray-500 mb-16">Tempus</p>

        {enviado ? (
          <div>
            <h1 className="text-3xl font-serif mb-4 text-gray-900">Verifique seu email</h1>
            <p className="text-sm text-gray-500 mb-8">
              Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.
            </p>
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-serif mb-2 text-gray-900">Redefinir Senha</h1>
            <p className="text-sm text-gray-500 mb-8">Insira o email para o qual deseja redefinir sua senha</p>

            <form onSubmit={handleSubmit} className="w-full max-w-sm">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contador@email.com"
                required
                className="w-full px-0 py-2 border-b border-gray-300 bg-transparent text-sm focus:outline-none focus:border-black transition mb-8"
              />

              {erro && <p className="text-xs text-red-500 mb-4">{erro}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded text-sm font-semibold uppercase tracking-widest hover:bg-gray-800 transition disabled:opacity-60 mb-6"
              >
                {loading ? 'Enviando...' : 'REDEFINIR SENHA'}
              </button>

              <Link to="/login" className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1">
                ← Voltar ao login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
