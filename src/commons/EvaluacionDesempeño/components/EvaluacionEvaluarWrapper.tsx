import React, { useState, useEffect } from 'react';
import EvaluacionEvaluar from './EvaluacionEvaluar.tsx';

const EvaluacionEvaluarWrapper: React.FC = () => {
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerUsuarioId = async () => {
      try {
        const userDataString = localStorage.getItem("userData");
        if (!userDataString) {
          console.error("Datos del usuario no encontrados en el almacenamiento local.");
          return;
        }
        
        const userData = JSON.parse(userDataString);
        setUsuarioId(userData.id);
        console.log('✅ Usuario ID obtenido:', userData.id);
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerUsuarioId();
  }, []);

  if (loading) {
    return <div>Cargando información del usuario...</div>;
  }

  if (!usuarioId) {
    return <div>Error: No se pudo obtener la información del usuario</div>;
  }

  return <EvaluacionEvaluar usuarioId={usuarioId} />;
};

export default EvaluacionEvaluarWrapper;
