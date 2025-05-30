import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  SupervisorAccount as AdminIcon,
  Person as UserIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

function Usuarios() {
  const navigate = useNavigate();
  const [usuarios] = useState([
    // Dados simulados enquanto não temos API completa
    {
      id: 1,
      nome: 'Administrador',
      email: 'admin@oficinmacedo.com',
      tipo: 'admin',
      ativo: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      nome: 'João Silva',
      email: 'joao@oficinmacedo.com',
      tipo: 'operador',
      ativo: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      nome: 'Maria Santos',
      email: 'maria@oficinmacedo.com',
      tipo: 'operador',
      ativo: false,
      createdAt: new Date().toISOString()
    }
  ]);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    // Verificar se é admin
    if (!authService.isAdmin()) {
      toast.error('Acesso negado - Apenas administradores');
      navigate('/');
      return;
    }
  }, [navigate]);

  const getTipoChip = (tipo) => {
    return tipo === 'admin' ? (
      <Chip
        label="Administrador"
        color="primary"
        size="small"
        icon={<AdminIcon />}
      />
    ) : (
      <Chip
        label="Operador"
        color="default"
        size="small"
        icon={<UserIcon />}
      />
    );
  };

  const getStatusChip = (ativo) => {
    return ativo ? (
      <Chip label="Ativo" color="success" size="small" />
    ) : (
      <Chip label="Inativo" color="error" size="small" />
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gerenciamento de Usuários</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/registro')}
        >
          NOVO USUÁRIO
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Funcionalidades disponíveis:</strong><br/>
          • Visualizar usuários cadastrados<br/>
          • Criar novos usuários (botão acima)<br/>
          • Controle de acesso por tipo de usuário
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {usuarios.map((usuario) => (
          <Grid item xs={12} md={6} lg={4} key={usuario.id}>
            <Card 
              elevation={2}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar 
                    sx={{ 
                      bgcolor: usuario.tipo === 'admin' ? 'primary.main' : 'grey.600',
                      width: 56,
                      height: 56
                    }}
                  >
                    {usuario.nome.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {usuario.nome}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        {usuario.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" gap={1} mb={2}>
                  {getTipoChip(usuario.tipo)}
                  {getStatusChip(usuario.ativo)}
                </Box>

                <Typography variant="body2" color="textSecondary">
                  Cadastrado em: {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                </Typography>

                {usuario.id === currentUser?.id && (
                  <Box mt={2}>
                    <Chip 
                      label="Você" 
                      color="secondary" 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Estatísticas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="h4" color="primary">
              {usuarios.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total de Usuários
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="h4" color="success.main">
              {usuarios.filter(u => u.tipo === 'admin').length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Administradores
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="h4" color="info.main">
              {usuarios.filter(u => u.tipo === 'operador').length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Operadores
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="h4" color="success.main">
              {usuarios.filter(u => u.ativo).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Usuários Ativos
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Usuarios;