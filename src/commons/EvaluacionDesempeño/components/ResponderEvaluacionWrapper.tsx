import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ResponderEvaluacion from './ResponderEvaluacion.tsx';

interface LocationState {
  asignacionId?: number;
  evaluacionId?: number;
  usuarioEvaluado?: any;
  evaluadorId?: number;
}

const ResponderEvaluacionWrapper: React.FC = () => {
  const { asignacionId } = useParams<{ asignacionId: string }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const asignacionIdNumber = asignacionId ? parseInt(asignacionId) : 0;

  if (!asignacionIdNumber) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error: ID de asignación no válido</h2>
        <p>No se pudo cargar la evaluación. Por favor, vuelva al dashboard e intente nuevamente.</p>
      </div>
    );
  }

  return (
    <ResponderEvaluacion 
      asignacionId={asignacionIdNumber}
      evaluacionId={state?.evaluacionId}
      usuarioEvaluado={state?.usuarioEvaluado}
      evaluadorId={state?.evaluadorId}
    />
  );
};

export default ResponderEvaluacionWrapper;
