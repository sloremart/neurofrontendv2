import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import {
  Dashboard,
  Person,
  Group,
  Assignment,
  Assessment,
  ArrowBack
} from '@mui/icons-material';

const EvaluacionPersonalNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserId(userData.id);
      } catch (error) {
        console.error("Error al parsear datos del usuario:", error);
      }
    }
  }, []);

  const menuItems = [
    {
      path: '/evaluacion_personal',
      label: 'Mi Dashboard',
      icon: <Dashboard />,
      description: 'Vista personal de evaluaciones'
    },
    {
      path: '/evaluacion_personal/lider',
      label: 'Dashboard Líder',
      icon: <Group />,
      description: 'Gestionar equipo y evaluaciones'
    },
    {
      path: '/evaluacion_personal/360',
      label: 'Evaluación 360°',
      icon: <Assessment />,
      description: 'Completar evaluaciones 360°'
    },
    {
      path: '/evaluacion_personal/actividades',
      label: 'Evaluar Actividades',
      icon: <Assignment />,
      description: 'Evaluar actividades laborales'
    }
  ];

  if (!userId) {
    return <div>Cargando...</div>;
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: '#f5f5f5', color: '#333' }}>
      <Toolbar>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2, color: '#666' }}
        >
          Volver
        </Button>
        
        <Typography variant="h6" sx={{ flexGrow: 1, color: '#333' }}>
          Sistema de Evaluación Personal
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            avatar={<Avatar sx={{ width: 20, height: 20 }}>{userId}</Avatar>}
            label={`Usuario ${userId}`}
            variant="outlined"
            size="small"
          />
        </Box>
      </Toolbar>

      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        px: 2, 
        pb: 1, 
        backgroundColor: '#fafafa',
        borderTop: '1px solid #e0e0e0'
      }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? 'contained' : 'text'}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: isActive ? '#1976d2' : 'transparent',
                color: isActive ? 'white' : '#666',
                '&:hover': {
                  backgroundColor: isActive ? '#1565c0' : '#f0f0f0'
                },
                borderRadius: 2,
                px: 2,
                py: 1,
                minWidth: 'auto',
                textTransform: 'none'
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>
    </AppBar>
  );
};

export default EvaluacionPersonalNav;
