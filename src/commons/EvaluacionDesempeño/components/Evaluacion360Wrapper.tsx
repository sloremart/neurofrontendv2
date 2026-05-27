import React, { useState, useEffect } from 'react';
import Evaluacion360 from './Evaluacion360.tsx';

const Evaluacion360Wrapper: React.FC = () => {
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [isLider, setIsLider] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectarRolUsuario = async () => {
      try {
        const userDataString = localStorage.getItem("userData");
        if (!userDataString) {
          console.error("Datos del usuario no encontrados en el almacenamiento local.");
          return;
        }
        
        const userData = JSON.parse(userDataString);
        setUsuarioId(userData.id);
        
        // Intentar detectar si es líder intentando cargar el dashboard de líder
        try {
          // Importar dinámicamente para evitar dependencias circulares
          const { getDashboardLiderResumen } = await import('../store/thunks/ThunksEvaluacionDesempeño.tsx');
          
          // Crear un dispatch mock para la detección
          const mockDispatch = (action: any) => {
            if (typeof action === 'function') {
              return action(mockDispatch);
            }
            return action;
          };
          
          const response = await getDashboardLiderResumen(userData.id)(mockDispatch);
          
          console.log('🔍 Respuesta del dashboard de líder:', response);
          
          // Si no hay error, es líder
          if (response && !response.error) {
            console.log('✅ Usuario detectado como LÍDER');
            setIsLider(true);
          } else {
            console.log('❌ Usuario NO es líder o hay error:', response?.error);
            setIsLider(false);
          }
        } catch (error) {
          // Si hay error, probablemente no es líder
          console.log('❌ Error al detectar si es líder:', error);
          setIsLider(false);
        }
      } catch (error) {
        console.error("Error al detectar rol del usuario:", error);
        setIsLider(false);
      } finally {
        setLoading(false);
      }
    };

    detectarRolUsuario();
  }, []);

  if (loading) {
    return <div>Cargando usuario y verificando permisos...</div>;
  }

  if (!usuarioId) {
    return <div>Error: No se pudo obtener la información del usuario</div>;
  }

  return <Evaluacion360 usuarioId={usuarioId} esLider={isLider} />;
};

export default Evaluacion360Wrapper;
