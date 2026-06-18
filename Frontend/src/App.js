import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import RedefinirSenha from './pages/RedefinirSenha';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Filiais from './pages/Filiais';
import Obrigacoes from './pages/Obrigacoes';
import Admin from './pages/Admin';
import './App.css';

function RotaProtegida({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RotaAdmin({ children }) {
  const { usuario, isAdmin } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      <Route path="/dashboard" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path="/clientes"  element={<RotaProtegida><Clientes /></RotaProtegida>} />
      <Route path="/filiais"   element={<RotaProtegida><Filiais /></RotaProtegida>} />
      <Route path="/obrigacoes" element={<RotaProtegida><Obrigacoes /></RotaProtegida>} />
      <Route path="/admin"     element={<RotaAdmin><Admin /></RotaAdmin>} />

      <Route path="*" element={<Navigate to={usuario ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
