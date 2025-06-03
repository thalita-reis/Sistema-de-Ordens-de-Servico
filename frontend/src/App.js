import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';

// ============================================
// 📱 IMPORTAÇÕES DE COMPONENTES - SISTEMA LIMPO
// ============================================
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

// 🔧 NOVO: Componente de Debug para testes da API
import DebugComponent from './components/DebugComponent';

// ✅ REMOVIDO: import Usuarios - Sistema limpo sem funcionalidades problemáticas
// import Usuarios from './pages/Usuarios/Usuarios';

import PrivateRoute from './components/Common/PrivateRoute';

// ============================================
// 🎨 CONFIGURAÇÃO DO TEMA MATERIAL-UI OTIMIZADO
// ============================================
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// ============================================
// 🏗️ COMPONENTE PRINCIPAL DA APLICAÇÃO
// ============================================
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* ============================================ */}
          {/* 🌐 ROTAS PÚBLICAS - ACESSO SEM AUTENTICAÇÃO */}
          {/* ============================================ */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          
          {/* 🔧 NOVA: Rota de Debug - Acesso direto para testes */}
          <Route path="/debug" element={<DebugComponent />} />
          
          {/* ============================================ */}
          {/* 🔐 ROTAS PRIVADAS - REQUEREM AUTENTICAÇÃO */}
          {/* ============================================ */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            
            {/* 📊 DASHBOARD PRINCIPAL */}
            <Route index element={<Dashboard />} />
            
            {/* 👤 ROTAS DE CLIENTES - SISTEMA COMPLETO */}
            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />
            <Route path="clientes/:id" element={<ClienteView />} />
            
            {/* 📋 ROTAS DE ORÇAMENTOS - SISTEMA COMPLETO */}
            <Route path="orcamentos" element={<OrcamentoList />} />
            <Route path="orcamentos/novo" element={<OrcamentoForm />} />
            <Route path="orcamentos/:id/editar" element={<OrcamentoForm />} />
            <Route path="orcamentos/:id" element={<OrcamentoView />} />

            {/* ✅ REMOVIDO: Rota de Usuários - Sistema limpo e estável */}
            {/* 
            ============================================
            👥 ROTA DE USUÁRIOS - REMOVIDA 
            ============================================
            Motivo: Funcionalidade causava erros de:
            - usuarios.map não é uma função
            - Problemas de importação
            - Instabilidade do sistema
            
            Para reativar no futuro:
            1. Corrigir todos os erros de estado
            2. Garantir compatibilidade com backend  
            3. Testar exaustivamente
            4. Descomentar linha abaixo:
            
            <Route path="usuarios" element={<Usuarios />} />
            ============================================
            */}

            {/* ⚙️ ROTA DE ADMINISTRAÇÃO - FUNCIONAL */}
            <Route path="administracao" element={<Administracao />} />
            
            {/* 🔧 ROTA DE DEBUG PROTEGIDA - Para usuários logados */}
            <Route path="debug-admin" element={<DebugComponent />} />
            
            {/* 🚫 ROTA 404 - REDIRECIONA PARA DASHBOARD */}
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Route>
          
          {/* 🔄 REDIRECT PADRÃO - LOGIN SE NÃO AUTENTICADO */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// ============================================
// 📝 DOCUMENTAÇÃO DA APLICAÇÃO
// ============================================
/*
🎯 SISTEMA MACEDO - APLICAÇÃO PRINCIPAL

✅ FUNCIONALIDADES ATIVAS:
- 🔐 Autenticação (Login/Registro)
- 📊 Dashboard com estatísticas
- 👤 Gestão completa de clientes
- 📋 Sistema de orçamentos
- ⚙️ Painel de administração
- 🔧 Sistema de debug para API (NOVO)

❌ FUNCIONALIDADES REMOVIDAS:
- 👥 Gestão de usuários (temporariamente removida para estabilidade)

🛡️ SISTEMA DE ROTAS:
- Rotas públicas: /login, /registro, /debug
- Rotas privadas: Todas dentro do Layout com PrivateRoute
- Rota de debug protegida: /debug-admin (para usuários logados)
- Proteção automática contra acesso não autorizado
- Redirecionamento inteligente

🔧 ROTAS DE DEBUG DISPONÍVEIS:
- /debug - Acesso público para testes básicos da API
- /debug-admin - Acesso protegido para debug avançado

🎨 TEMA:
- Material-UI v5 com tema customizado
- Cores: Azul primário (#1976d2), Rosa secundário (#dc004e)
- Design responsivo e moderno
- Componentes otimizados

🔄 NAVEGAÇÃO:
- React Router v6
- Navegação programática
- Estados preservados
- Performance otimizada

💡 PARA DESENVOLVEDORES:
- Código limpo e bem documentado
- Componentes reutilizáveis
- Padrões consistentes
- Fácil manutenção
- Sistema de debug integrado

🔧 CONFIGURAÇÃO:
- Context API para autenticação
- ThemeProvider para estilos
- CssBaseline para reset de CSS
- Estrutura modular e escalável
- Debugging tools integradas
*/