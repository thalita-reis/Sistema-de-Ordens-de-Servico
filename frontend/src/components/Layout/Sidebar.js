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
  Settings as SettingsIcon,
  SupervisorAccount as UsersIcon
} from '@mui/icons-material';
import authService from '../../services/authService';

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
  {
    text: 'Usuários',
    icon: <UsersIcon />,
    path: '/usuarios',
    adminOnly: true
  },
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

      {/* Footer com info do usuário */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 16, 
        left: 16, 
        right: 16,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 1
      }}>
        <Typography variant="caption" color="textSecondary">
          Oficina Macedo
        </Typography>
        <br />
        <Typography variant="caption" color="textSecondary">
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}

export default Sidebar;