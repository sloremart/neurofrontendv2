import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { pathname } = useLocation();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isAdminGerencia = userData?.cargo === 'AdministrativoGerencia';

  return (
    <nav style={{
      background: 'linear-gradient(to right, #381A73, #1e3a8a, #0f766e)',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'center',
      gap: '32px',
      color: 'white',
      fontWeight: 600
    }}>

      {!isAdminGerencia && (
        <Link
          to="/informe_fact"
          style={{
            color: pathname === '/informe_fact' ? '#facc15' : 'white',
            textDecoration: 'none'
          }}
        >
          CARTERA
        </Link>
      )}

      {!isAdminGerencia && (
        <Link
          to="/dashboard"
          style={{
            color: pathname === '/dashboard' ? '#facc15' : 'white',
            textDecoration: 'none'
          }}
        >
          FACTURACIÓN
        </Link>
      )}

      {!isAdminGerencia && (
        <Link
          to="/dashboard_agendamiento"
          style={{
            color: pathname === '/dashboard_agendamiento' ? '#facc15' : 'white',
            textDecoration: 'none'
          }}
        >
          AGENDAMIENTO
        </Link>
      )}

      {!isAdminGerencia && (
        <Link
          to="/recaudo"
          style={{
            color: pathname === '/recaudo' ? '#facc15' : 'white',
            textDecoration: 'none'
          }}
        >
          RECAUDO
        </Link>
      )}

      <Link
        to="/facturas_proveedores"
        style={{
          color: pathname === '/facturas_proveedores' ? '#facc15' : 'white',
          textDecoration: 'none'
        }}
      >
        GDF PROVEEDORES
      </Link>
    </nav>
  );
};

export default Navbar;
