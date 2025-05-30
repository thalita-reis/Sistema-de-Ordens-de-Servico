import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Divider
} from '@mui/material';
import { Person, Lock } from '@mui/icons-material';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Tentando fazer login...', formData);
      
      const response = await authService.login(formData);
      
      console.log('✅ Resposta do login:', response.data);
      
      // Usar o método login do AuthContext
      login(response.data.usuario, response.data.token);
      
      console.log('✅ Login realizado, redirecionando...');
      
      // Redirecionar para dashboard
      navigate('/');
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={3}
      >
        {/* Logo/Título */}
        <Typography variant="h4" component="h1" textAlign="center" color="primary">
          Sistema de Ordens de Serviço
        </Typography>

        {/* Formulário de Login */}
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Typography variant="h5" component="h2" textAlign="center" mb={3}>
            Entrar no Sistema
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="E-mail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </Button>
          </form>

          {/* Divisor */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="textSecondary">
              OU
            </Typography>
          </Divider>

          {/* Botão Criar Conta */}
          <Button
            component={Link}
            to="/registro"
            fullWidth
            variant="outlined"
            size="large"
            sx={{ py: 1.5 }}
          >
            CRIAR NOVA CONTA
          </Button>

          {/* Link para Admin */}
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="textSecondary">
              Problemas com acesso?{' '}
              <Link 
                to="/contato" 
                style={{ color: '#1976d2', textDecoration: 'none' }}
              >
                Entre em contato
              </Link>
            </Typography>
          </Box>
        </Paper>

        {/* Rodapé */}
        <Typography variant="body2" color="textSecondary" textAlign="center">
          © 2024 Oficina Macedo - Sistema de Gestão
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;