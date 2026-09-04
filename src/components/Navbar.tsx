import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { pathname } = useLocation();

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

      <Link
        to="/dashboard_agendamiento"
        style={{
          color: pathname === '/dashboard_agendamiento' ? '#facc15' : 'white',
          textDecoration: 'none'
        }}
      >
        AGENDAMIENTO
      </Link>

      <Link
        to="/dashboard"
        style={{
          color: pathname === '/dashboard' ? '#facc15' : 'white',
          textDecoration: 'none'
        }}
      >
        FACTURACIÓN
      </Link>

      <Link
        to="/facturas_proveedores"
        style={{
          color: pathname === '/facturas_proveedores' ? '#facc15' : 'white',
          textDecoration: 'none'
        }}
      >
        GDF PROVEEDORES
      </Link>

      <Link
        to="/carga_autorizaciones"
        style={{
          color: pathname === '/carga_autorizaciones' ? '#facc15' : 'white',
          textDecoration: 'none'
        }}
      >
        AUTORIZACIONES
      </Link>
    </nav>
  );
};

export default Navbar;
