import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import EvaluacionPersonalNav from './EvaluacionPersonalNav.tsx';

const EvaluacionPersonalLayout: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <EvaluacionPersonalNav />
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default EvaluacionPersonalLayout;
