import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon
  // ✅ REMOVIDO: SupervisorAccount as UsersIcon - não é mais necessário
} from '@mui/icons-material';
import authService from '../../services/authService';

// ✅ MENU LIMPO: Apenas funcionalidades que funcionam perfeitamente
const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    adminOnly: false
  },
  {
    text: 'Clientes',
    icon: <PeopleIcon />,
    path: '/clientes',
    adminOnly: false
  },
  {
    text: 'Orçamentos',
    icon: <ReceiptIcon />,
    path: '/orcamentos',
    adminOnly: false
  },
  // ✅ REMOVIDO: Objeto inteiro da aba "Usuários" (linhas 32-36)
  // {
  //   text: 'Usuários',
  //   icon: <UsersIcon />,
  //   path: '/usuarios',
  //   adminOnly: true
  // },
  {
    text: 'Administração',
    icon: <SettingsIcon />,
    path: '/administracao',
    adminOnly: true
  }
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  const handleItemClick = (path) => {
    navigate(path);
  };

  // Filtrar itens baseado no tipo de usuário
  const visibleItems = menuItems.filter(item => 
    !item.adminOnly || isAdmin
  );

  return (
    <Box sx={{ width: 250, height: '100%', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Sistema OS
        </Typography>
        {currentUser && (
          <>
            <Typography variant="body2" color="textSecondary">
              {currentUser.nome}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {currentUser.tipo === 'admin' ? 'Administrador' : 'Operador'}
            </Typography>
          </>
        )}
      </Box>

      {/* Menu Items */}
      <List sx={{ pt: 2 }}>
        {visibleItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleItemClick(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* ✅ REMOVIDO: Footer com "Oficina Macedo v1.0.0" */}
      {/* 
      Aqui estava a faixa cinza que foi removida:
      - Box com position absolute
      - Typography com "Oficina Macedo"
      - Typography com "v1.0.0"
      
      Agora a sidebar fica mais limpa e profissional!
      */}
    </Box>
  );
}

export default Sidebar;