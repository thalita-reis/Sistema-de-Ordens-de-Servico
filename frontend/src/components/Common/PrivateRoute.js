import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  console.log('🔒 PrivateRoute - Estado atual:', {
    user: user,
    token: token ? 'EXISTE' : 'NÃO EXISTE',
    loading: loading
  });

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    console.log('⏳ PrivateRoute - Carregando...');
    return <LoadingSpinner />;
  }

  // Verificar se está autenticado
  const isAuthenticated = token && user;
  
  console.log('🎯 PrivateRoute - Autenticado:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('❌ PrivateRoute - Não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ PrivateRoute - Autenticado, mostrando conteúdo');
  return children;
};

export default PrivateRoute;