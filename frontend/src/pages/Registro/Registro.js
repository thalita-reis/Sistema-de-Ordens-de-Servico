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
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { Person, Email, Lock, Badge, ArrowBack } from '@mui/icons-material';
import authService from '../../services/authService';

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    tipo: 'operador'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return false;
    }
    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const dados = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha: formData.senha,
        tipo: formData.tipo
      };

      await authService.register(dados);
      
      setSuccess('Conta criada com sucesso! Você pode fazer login agora.');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao criar conta');
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

        {/* Formulário de Registro */}
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Button
              component={Link}
              to="/login"
              startIcon={<ArrowBack />}
              variant="outlined"
              size="small"
              sx={{ mr: 2 }}
            >
              Voltar
            </Button>
            <Typography variant="h5" component="h2">
              Criar Nova Conta
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

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
                startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Usuário</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                label="Tipo de Usuário"
                startAdornment={<Badge sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="operador">Operador</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Senha"
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleChange}
              required
              margin="normal"
              helperText="Mínimo 6 caracteres"
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

            <TextField
              fullWidth
              label="Confirmar Senha"
              name="confirmarSenha"
              type="password"
              value={formData.confirmarSenha}
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
              {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
            </Button>
          </form>

          {/* Link para Login */}
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="textSecondary">
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                style={{ color: '#1976d2', textDecoration: 'none' }}
              >
                Fazer login
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

export default Registro;