import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Tooltip, Typography, Divider, IconButton, Collapse, Avatar,
} from '@mui/material';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import BiotechIcon from '@mui/icons-material/Biotech';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import SavingsIcon from '@mui/icons-material/Savings';
import SummarizeIcon from '@mui/icons-material/Summarize';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SIDEBAR_W = 248;
const MINI_W    = 62;

const BG        = '#0D0E1C';
const BG_HOVER  = 'rgba(139,92,246,0.10)';
const ACTIVE_BG = 'rgba(139,92,246,0.16)';
const ACCENT    = '#A78BFA';
const TEXT_DIM  = 'rgba(255,255,255,0.45)';
const TEXT_MAIN = 'rgba(255,255,255,0.82)';

type Rol =
  | 'CuentasMedicas' | 'LiderCuentasMedicas'
  | 'EstudiosSueño'  | 'Asistencial'
  | 'Contador'       | 'Financiera'
  | 'Administrativo' | 'AdministrativoGerencia'
  | 'Sistemas'       | 'OPERSALUD'
  | 'Facturador';

interface MenuItem { label: string; path: string; icon: React.ReactNode; roles: Rol[] }
interface MenuGroup { group: string; items: MenuItem[] }

const TODOS: Rol[] = [];

const MENU: MenuGroup[] = [
  {
    group: 'Gestión Documental',
    items: [
      { label: 'GE Documental',        path: '/ge_documental',                 icon: <FolderOpenIcon />,            roles: ['CuentasMedicas', 'LiderCuentasMedicas', 'EstudiosSueño', 'Asistencial', 'OPERSALUD', 'Facturador'] },
      { label: 'Cuentas Médicas',      path: '/cuentas_medicas',                icon: <PeopleOutlineIcon />,         roles: ['CuentasMedicas', 'LiderCuentasMedicas'] },
      { label: 'Radicación',           path: '/radicacion',                    icon: <RequestQuoteIcon />,          roles: ['CuentasMedicas', 'LiderCuentasMedicas'] },
      { label: 'Códigos CUFE',         path: '/codigo_cufe',                   icon: <QrCode2Icon />,               roles: ['LiderCuentasMedicas'] },
      { label: 'GE Documental Estudios', path: '/ge_documental_resultados',    icon: <AssignmentTurnedInIcon />,    roles: ['EstudiosSueño'] },
      { label: 'Prog. Pagos',          path: '/documental_programacion_pagos', icon: <AccountBalanceWalletIcon />,  roles: ['Contador', 'Financiera'] },
      { label: 'Tesorería',            path: '/tesoreria',                     icon: <AccountBalanceIcon />,        roles: ['Contador'] },
      { label: 'Caja Facturación',    path: '/caja_facturacion',              icon: <SavingsIcon />,               roles: ['Facturador'] },
      { label: 'Fact. Proveedores',    path: '/facturas_proveedores',          icon: <ReceiptLongIcon />,           roles: ['Contador', 'Financiera', 'AdministrativoGerencia'] },
      { label: 'Autorizaciones',       path: '/carga_autorizaciones',          icon: <VerifiedUserIcon />,          roles: ['CuentasMedicas', 'LiderCuentasMedicas'] },
    ],
  },
  {
    group: 'Dashboard',
    items: [
      { label: 'Facturación',   path: '/dashboard',               icon: <BarChartIcon />,      roles: ['Administrativo', 'AdministrativoGerencia', 'Sistemas', 'Financiera'] },
      { label: 'Agendamiento',  path: '/dashboard_agendamiento',  icon: <CalendarMonthIcon />, roles: ['Administrativo', 'AdministrativoGerencia', 'Sistemas', 'Financiera'] },
    ],
  },
  {
    group: 'Evaluación',
    items: [
      { label: 'Dashboard Eval.', path: '/evaluacion_dashboard', icon: <WorkspacePremiumIcon />, roles: ['AdministrativoGerencia'] },
      { label: 'Eval. Personal',  path: '/evaluacion_personal',  icon: <PersonOutlineIcon />,   roles: TODOS },
    ],
  },
];

const canAccess = (roles: Rol[], userRole: string) =>
  roles.length === 0 || roles.includes(userRole as Rol);

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ─────────────────────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]           = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole: string = userData?.cargo  || '';
  const userName: string = userData?.nombre || userData?.username || 'Usuario';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const toggleGroup = (group: string) =>
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));

  const drawerWidth = open ? SIDEBAR_W : MINI_W;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'width 0.22s ease',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          overflowX: 'hidden',
          background: BG,
          color: '#fff',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'width 0.22s ease',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Logo ── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
        px: open ? 1.5 : 0,
        py: 1.8,
        justifyContent: open ? 'space-between' : 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, overflow: 'hidden' }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden',
            border: '2px solid rgba(167,139,250,0.4)',
            background: '#1a1a2e',
            ml: open ? 0 : 'auto',
            mr: open ? 0 : 'auto',
          }}>
            <img
              src="/logoneuro.jpeg"
              alt="logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          {open && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: 0.3 }}>
                <Box component="span" sx={{ color: ACCENT }}>Neuro</Box>dx
              </Typography>
              <Typography sx={{ fontSize: 9.5, color: TEXT_DIM, letterSpacing: 0.8, textTransform: 'uppercase', mt: 0.2 }}>
                Sistema de gestión
              </Typography>
            </Box>
          )}
        </Box>
        <IconButton
          onClick={() => setOpen(p => !p)}
          size="small"
          sx={{ color: TEXT_DIM, flexShrink: 0, '&:hover': { color: '#fff', background: BG_HOVER } }}
        >
          {open ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* ── Usuario ── */}
      {open ? (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.2,
          mx: 1.2, my: 1.2, px: 1.2, py: 1,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <Avatar sx={{
            width: 32, height: 32, fontSize: 11, fontWeight: 700, flexShrink: 0,
            background: 'linear-gradient(135deg, #6D28D9, #2563EB)',
          }}>
            {getInitials(userName)}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: TEXT_MAIN, lineHeight: 1.3 }}>
              {userName}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.2 }}>
          <Tooltip title={`${userName} · ${userRole}`} placement="right" arrow>
            <Avatar sx={{
              width: 32, height: 32, fontSize: 11, fontWeight: 700, cursor: 'default',
              background: 'linear-gradient(135deg, #6D28D9, #2563EB)',
            }}>
              {getInitials(userName)}
            </Avatar>
          </Tooltip>
        </Box>
      )}

      {/* ── Menu ── */}
      <Box sx={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', pb: 1,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(167,139,250,0.2)', borderRadius: 2 },
      }}>
        {MENU.map(({ group, items }) => {
          const visibleItems = items.filter(item => canAccess(item.roles, userRole));
          if (visibleItems.length === 0) return null;

          const isCollapsed = collapsed[group];

          return (
            <Box key={group} sx={{ mb: 0.5 }}>
              {open ? (
                <ListItemButton
                  onClick={() => toggleGroup(group)}
                  dense
                  sx={{
                    px: 2, py: 0.6, mt: 1,
                    '&:hover': { background: 'transparent' },
                  }}
                >
                  <ListItemText
                    primary={group.toUpperCase()}
                    primaryTypographyProps={{
                      sx: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: TEXT_DIM },
                    }}
                  />
                  {isCollapsed
                    ? <ExpandMoreIcon sx={{ fontSize: 13, color: TEXT_DIM }} />
                    : <ExpandLessIcon sx={{ fontSize: 13, color: TEXT_DIM }} />
                  }
                </ListItemButton>
              ) : (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1, mx: 1.5 }} />
              )}

              <Collapse in={!isCollapsed} timeout="auto">
                <List dense disablePadding sx={{ px: 1 }}>
                  {visibleItems.map(item => {
                    const active =
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/');

                    return (
                      <Tooltip
                        key={item.path}
                        title={open ? '' : item.label}
                        placement="right"
                        arrow
                      >
                        <ListItemButton
                          onClick={() => navigate(item.path)}
                          sx={{
                            pl: open ? 1.5 : 0,
                            pr: 1,
                            py: 0.75,
                            mb: 0.25,
                            borderRadius: 1.5,
                            justifyContent: open ? 'flex-start' : 'center',
                            position: 'relative',
                            color: active ? '#fff' : TEXT_MAIN,
                            background: active ? ACTIVE_BG : 'transparent',
                            borderLeft: active
                              ? `3px solid ${ACCENT}`
                              : '3px solid transparent',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              background: BG_HOVER,
                              color: '#fff',
                            },
                          }}
                        >
                          <ListItemIcon sx={{
                            minWidth: open ? 34 : 'auto',
                            justifyContent: 'center',
                            color: active ? ACCENT : TEXT_DIM,
                            '& svg': { fontSize: 18 },
                          }}>
                            {item.icon}
                          </ListItemIcon>
                          {open && (
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                sx: {
                                  fontSize: 13,
                                  fontWeight: active ? 600 : 400,
                                  color: active ? '#fff' : TEXT_MAIN,
                                  letterSpacing: 0.1,
                                },
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* ── Logout ── */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', p: 1 }}>
        <Tooltip title={open ? '' : 'Cerrar sesión'} placement="right" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1.5,
              py: 0.8,
              px: open ? 1.5 : 0,
              justifyContent: open ? 'flex-start' : 'center',
              color: TEXT_DIM,
              transition: 'all 0.15s ease',
              '&:hover': { background: 'rgba(239,68,68,0.12)', color: '#F87171' },
            }}
          >
            <ListItemIcon sx={{
              color: 'inherit', minWidth: open ? 34 : 'auto',
              justifyContent: 'center',
              '& svg': { fontSize: 18 },
            }}>
              <LogoutIcon />
            </ListItemIcon>
            {open && (
              <ListItemText
                primary="Cerrar sesión"
                primaryTypographyProps={{ sx: { fontSize: 13 } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
