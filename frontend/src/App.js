import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientesList from './pages/Clientes/ClientesList';
import ClienteForm from './pages/Clientes/ClienteForm';
import ClienteView from './pages/Clientes/ClienteView';
import OrcamentoList from './pages/Orcamentos/OrcamentoList';
import OrcamentoForm from './pages/Orcamentos/OrcamentoForm';
import OrcamentoView from './pages/Orcamentos/OrcamentoView';
import Administracao from './pages/Administracao/Administracao';
import Registro from './pages/Registro/Registro';
import Usuarios from './pages/Usuarios/Usuarios'; // ← ADICIONADO
import PrivateRoute from './components/Common/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          
          {/* Rotas Privadas */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            
            {/* Rotas de Clientes */}
            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />
            <Route path="clientes/:id" element={<ClienteView />} />
            
            {/* Rotas de Orçamentos */}
            <Route path="orcamentos" element={<OrcamentoList />} />
            <Route path="orcamentos/novo" element={<OrcamentoForm />} />
            <Route path="orcamentos/:id/editar" element={<OrcamentoForm />} />
            <Route path="orcamentos/:id" element={<OrcamentoView />} />
            
            {/* Rota de Usuários */}
            <Route path="usuarios" element={<Usuarios />} />
            
            {/* Rota de Administração */}
            <Route path="administracao" element={<Administracao />} />
          </Route>
          
          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;