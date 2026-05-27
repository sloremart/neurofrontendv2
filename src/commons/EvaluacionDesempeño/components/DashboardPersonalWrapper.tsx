import React, { useState, useEffect } from 'react';
import DashboardPersonal from './DashboardPersonal.tsx';

const DashboardPersonalWrapper: React.FC = () => {
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) {
      console.error("Datos del usuario no encontrados en el almacenamiento local.");
      return;
    }
    
    try {
      const userData = JSON.parse(userDataString);
      setUsuarioId(userData.id);
    } catch (error) {
      console.error("Error al parsear datos del usuario:", error);
    }
  }, []);

  if (!usuarioId) {
    return <div>Cargando usuario...</div>;
  }

  return <DashboardPersonal usuarioId={usuarioId} />;
};

export default DashboardPersonalWrapper;
