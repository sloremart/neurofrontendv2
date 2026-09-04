import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';

const SidebarLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F0F2F8' }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default SidebarLayout;
