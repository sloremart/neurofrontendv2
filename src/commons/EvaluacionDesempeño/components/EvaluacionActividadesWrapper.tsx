import React, { useState, useEffect } from 'react';
import EvaluacionActividadesLaborales from './EvaluacionActividadesLaborales.tsx';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Block } from '@mui/icons-material';

const EvaluacionActividadesWrapper: React.FC = () => {
  const [liderId, setLiderId] = useState<number | null>(null);
  const [esLider, setEsLider] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarRol = async () => {
      try {
        const userDataString = localStorage.getItem("userData");
        if (!userDataString) {
          console.error("Datos del usuario no encontrados en el almacenamiento local.");
          return;
        }
        
        const userData = JSON.parse(userDataString);
        setLiderId(userData.id);
        
        // Verificar si el usuario es líder
        const perfilResponse = await fetch(`http://localhost:8000/evaluaciondesempeno/perfiles-usuario/${userData.id}/`);
        if (perfilResponse.ok) {
          const perfil = await perfilResponse.json();
          setEsLider(perfil.perfil?.es_lider === true);
        } else {
          setEsLider(false);
        }
      } catch (error) {
        console.error("Error al verificar rol:", error);
        setEsLider(false);
      } finally {
        setLoading(false);
      }
    };

    verificarRol();
  }, []);

  if (loading) {
    return <div>Cargando usuario...</div>;
  }

  if (!esLider) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Block sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" color="error" gutterBottom>
            Acceso No Permitido
          </Typography>
          <Typography variant="h6" color="textSecondary" paragraph>
            Solo los líderes pueden acceder a esta vista
          </Typography>
          <Alert severity="warning">
            Tu usuario no tiene permisos de líder. Contacta al administrador si crees que esto es un error.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return <EvaluacionActividadesLaborales liderId={liderId!} />;
};

export default EvaluacionActividadesWrapper;
