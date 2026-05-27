import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.tsx';
import React from 'react';

const DashboardLayout = () => {
  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Outlet />
      </div>
    </>
  );
};

export default DashboardLayout;
