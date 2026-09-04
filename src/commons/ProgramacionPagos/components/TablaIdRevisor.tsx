import React, { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  Tabs, Tab, Box, Chip, Tooltip, IconButton,
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
  Card, CardContent,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { AppDispatch, RootState } from "../../../store/store.ts";
import { get_factura_pendiente_revisor, revisar_factura_proveedor } from "../store/thunks/ProgramacionPagosThunks.tsx";
import { get_users } from "../../Login/store/thunks/ThunksLogin.tsx";
import CONFIG from "../../../config/api.js";
import { toast } from "react-toastify";
import { IObjAdmision } from "../interface/ProgramacionPago";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const formatearFecha = (value: string) => {
  if (!value) return "";
  try {
    const f = new Date(value);
    if (isNaN(f.getTime())) return value;
    return `${f.getDate().toString().padStart(2,'0')}/${(f.getMonth()+1).toString().padStart(2,'0')}/${f.getFullYear()} ${f.getHours().toString().padStart(2,'0')}:${f.getMinutes().toString().padStart(2,'0')}`;
  } catch { return value; }
};

const EstadoChip = ({ aprobada, fecha, rechazada }: { aprobada?: boolean; fecha?: string; rechazada?: boolean }) => {
  if (!fecha) return <Chip label="Pendiente" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: 11 }} />;
  if (rechazada) return <Chip label="Rechazada" size="small" color="error" sx={{ fontWeight: 600, fontSize: 11 }} />;
  if (aprobada) return <Chip label="Aprobada" size="small" color="success" sx={{ fontWeight: 600, fontSize: 11 }} />;
  return <Chip label="No aprobada" size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 600, fontSize: 11 }} />;
};

const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <Box sx={{
    px: 2.5, py: 1.5,
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    display: "flex", alignItems: "center", gap: 1,
    borderRadius: "8px 8px 0 0",
  }}>
    <Box sx={{ color: "rgba(255,255,255,0.8)", display: "flex", fontSize: 18 }}>{icon}</Box>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

const HEADER_SX = {
  '& .MuiDataGrid-columnHeaders': {
    background: 'linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
  },
  '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 700 },
  '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton': { color: 'rgba(255,255,255,0.7)' },
  '& .MuiDataGrid-row:hover': { bgcolor: '#F5F3FF' },
  '& .MuiDataGrid-row.Mui-selected': { bgcolor: '#EDE9FE' },
  borderRadius: 2,
  border: '1px solid #E5E7EB',
};

export const TablaProveedor = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useSelector((state: RootState) => state.users);

  const getNombre = (userId: number | null) => {
    if (!userId) return '';
    const u = users.find(u => u.id === userId);
    return u?.nombre || u?.username || `Usuario ${userId}`;
  };

  const [modalOpen, setModalOpen]                     = useState(false);
  const [observacion, setObservacion]                 = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<number | null>(null);
  const [modoAccion, setModoAccion]                   = useState<"aprobar" | "rechazar" | null>(null);
  const [currentTab, setCurrentTab]                   = useState(0);
  const [archivosPendientes, setArchivosPendientes]   = useState<IObjAdmision[]>([]);
  const [archivosHistorial, setArchivosHistorial]     = useState<IObjAdmision[]>([]);

  const userData  = JSON.parse(localStorage.getItem("userData") || "{}");
  const idRevisor = userData?.id;

  useEffect(() => { dispatch(get_users()); }, [dispatch]);

  useEffect(() => {
    if (idRevisor) {
      dispatch(get_factura_pendiente_revisor(idRevisor.toString()))
        .unwrap()
        .then((response: any) => {
          if (response.success) {
            setArchivosPendientes(response.data.pendientes || []);
            setArchivosHistorial(response.data.historicas  || []);
          }
        })
        .catch((err: any) => console.error(err));
    }
  }, [idRevisor, dispatch]);

  const handleOpenModal  = (id: number, modo: "aprobar" | "rechazar") => { setArchivoSeleccionado(id); setModoAccion(modo); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setArchivoSeleccionado(null); setObservacion(""); setModoAccion(null); };

  const handleEnviarAccion = async () => {
    if (!archivoSeleccionado) { toast.error("Archivo no seleccionado."); return; }
    if (modoAccion === "rechazar" && !observacion.trim()) { toast.error("Debe escribir una observación al rechazar."); return; }
    const ud = JSON.parse(localStorage.getItem("userData") || "{}");
    const descripcionFinal = modoAccion === "rechazar" ? `${observacion.trim()} / ${ud.nombre || "Usuario"}` : observacion.trim();
    await dispatch(revisar_factura_proveedor({ idArchivo: archivoSeleccionado, aprobado: modoAccion === "aprobar", usuarioId: ud.id, descripcion: descripcionFinal }));
    dispatch(get_factura_pendiente_revisor(ud.id.toString()));
    handleCloseModal();
  };

  const handleVer = (id: number) => window.open(`${API_ENDPOINT}/gedocumental/descargar/${id}/`, "_blank");

  const puedeRevisar = (archivo: any) => {
    const uid = parseInt(userData?.id || "0");
    if (archivo.IdRevisor === uid && !archivo.RevisionPrimera) return true;
    if (archivo.IdRevisorTesoreria === uid && archivo.RevisionPrimera === true && !archivo.FechaRevisionSegunda) return true;
    if (archivo.UsuarioCuentasMedicas === uid && archivo.RevisionPrimera === true && archivo.RevisionSegunda === true && !archivo.FechaRevisionTercera && !archivo.FechaRechazo) return true;
    return false;
  };

  const colFecha = (field: string, headerName: string): GridColDef => ({
    field, headerName, width: 145, sortable: false,
    valueFormatter: (p: any) => p.value ? formatearFecha(p.value) : '',
  });

  const colRevisor = (field: string, headerName: string): GridColDef => ({
    field, headerName, width: 150, sortable: false,
    renderCell: (p: any) => {
      if (!p.value) return <span style={{ color: '#9CA3AF' }}>—</span>;
      const u = users.find(u => u.id === p.value);
      return <span>{u?.nombre || u?.username || "Sin asignar"}</span>;
    },
  });

  const colEstado1 = (forHistorial = false): GridColDef => ({
    field: 'RevisionPrimera', headerName: 'Estado 1', width: 130, sortable: false,
    renderCell: (p: any) => {
      const a = p.row;
      if (!a.FechaRevisionPrimera) return <EstadoChip />;
      if (a.FechaRechazo && a.UsuarioRechazo === a.IdRevisor) return <EstadoChip fecha="x" rechazada />;
      return <EstadoChip fecha={a.FechaRevisionPrimera} aprobada={a.RevisionPrimera} />;
    },
  });

  const colEstado2: GridColDef = {
    field: 'RevisionSegunda', headerName: 'Estado 2', width: 130, sortable: false,
    renderCell: (p: any) => {
      const a = p.row;
      if (!a.FechaRevisionSegunda) return <EstadoChip />;
      return <EstadoChip fecha={a.FechaRevisionSegunda} aprobada={a.RevisionSegunda} rechazada={!a.RevisionSegunda} />;
    },
  };

  const colEstado3: GridColDef = {
    field: 'RevisionTercera', headerName: 'Estado 3', width: 130, sortable: false,
    renderCell: (p: any) => {
      const a = p.row;
      if (!a.FechaRevisionTercera) return <EstadoChip />;
      return <EstadoChip fecha={a.FechaRevisionTercera} aprobada={a.RevisionTercera} rechazada={!a.RevisionTercera} />;
    },
  };

  const colVer: GridColDef = {
    field: 'verDocumento', headerName: 'Ver', width: 70, sortable: false,
    renderCell: (p: any) => (
      <Tooltip title="Ver documento" arrow>
        <IconButton size="small" color="primary" onClick={() => handleVer(p.row.IdArchivo)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  };

  const colAcciones: GridColDef = {
    field: 'actions', headerName: 'Acciones', width: 100, sortable: false,
    renderCell: (p: any) => {
      const puede = puedeRevisar(p.row as IObjAdmision);
      return (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Aprobar" arrow>
            <span>
              <IconButton size="small" color="success" disabled={!puede} onClick={() => handleOpenModal(p.row.IdArchivo, "aprobar")}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Rechazar" arrow>
            <span>
              <IconButton size="small" color="error" disabled={!puede} onClick={() => handleOpenModal(p.row.IdArchivo, "rechazar")}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      );
    },
  };

  const columnsPendientes: GridColDef[] = [
    colFecha('FechaCreacionArchivo', 'Fecha Creación'),
    { field: 'TipoHallazgo', headerName: 'Nombre', width: 210, sortable: false },
    colRevisor('IdRevisor', 'Revisor 1'),
    colEstado1(),
    colFecha('FechaRevisionPrimera', 'Fecha Rev. 1'),
    colRevisor('IdRevisorTesoreria', 'Revisor 2'),
    colEstado2,
    colFecha('FechaRevisionSegunda', 'Fecha Rev. 2'),
    colRevisor('UsuarioCuentasMedicas', 'Revisor 3'),
    colEstado3,
    colFecha('FechaRevisionTercera', 'Fecha Rev. 3'),
    colAcciones,
    colVer,
  ];

  const columnsHistorial: GridColDef[] = [
    colFecha('FechaCreacionArchivo', 'Fecha Creación'),
    { field: 'TipoHallazgo', headerName: 'Nombre', width: 210, sortable: false },
    colRevisor('IdRevisor', 'Revisor 1'),
    colEstado1(true),
    colFecha('FechaRevisionPrimera', 'Fecha Rev. 1'),
    colRevisor('IdRevisorTesoreria', 'Revisor 2'),
    colEstado2,
    colFecha('FechaRevisionSegunda', 'Fecha Rev. 2'),
    colRevisor('UsuarioCuentasMedicas', 'Revisor 3'),
    colEstado3,
    colFecha('FechaRevisionTercera', 'Fecha Rev. 3'),
    colFecha('FechaRechazo', 'Fecha Rechazo'),
    { field: 'UsuarioRechazo', headerName: 'Rechazado por', width: 150, sortable: false, valueGetter: (p: any) => getNombre(p.row.UsuarioRechazo) },
    colVer,
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Card variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E5E7EB' }}>
        <SectionHeader icon={<ReceiptLongIcon />} label="GESTIÓN DE FACTURAS — REVISIÓN Y APROBACIÓN" />
        <CardContent sx={{ pb: '16px !important' }}>

          {/* Tabs */}
          <Tabs
            value={currentTab}
            onChange={(_e, v) => setCurrentTab(v)}
            sx={{
              mb: 2,
              '& .MuiTabs-indicator': { bgcolor: '#381A73', height: 3 },
              '& .MuiTab-root': { fontWeight: 600, fontSize: 13, textTransform: 'none', color: '#6B7280' },
              '& .Mui-selected': { color: '#381A73 !important' },
            }}
          >
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Facturas Pendientes
                <Chip label={archivosPendientes.length} size="small" sx={{ bgcolor: '#381A73', color: '#fff', fontWeight: 700, height: 20, fontSize: 11 }} />
              </Box>
            } />
            <Tab label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Historial
                <Chip label={archivosHistorial.length} size="small" sx={{ bgcolor: '#E5E7EB', color: '#374151', fontWeight: 700, height: 20, fontSize: 11 }} />
              </Box>
            } />
          </Tabs>

          {/* Grids */}
          {currentTab === 0 && (
            <DataGrid
              sx={HEADER_SX}
              density="compact"
              autoHeight
              columns={columnsPendientes}
              getRowId={(row: IObjAdmision) => row.IdArchivo ?? 0}
              rows={archivosPendientes}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            />
          )}
          {currentTab === 1 && (
            <DataGrid
              sx={HEADER_SX}
              density="compact"
              autoHeight
              columns={columnsHistorial}
              getRowId={(row: IObjAdmision) => row.IdArchivo ?? 0}
              rows={archivosHistorial}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            />
          )}

        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} PaperProps={{ sx: { width: 520, borderRadius: 3 } }}>
        <DialogTitle sx={{
          background: modoAccion === 'aprobar'
            ? 'linear-gradient(90deg, #065F46, #047857)'
            : 'linear-gradient(90deg, #7F1D1D, #B91C1C)',
          color: '#fff', fontWeight: 700, fontSize: 15,
        }}>
          {modoAccion === 'aprobar' ? '✓ Aprobar factura' : '✕ Rechazar factura'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 1 }}>
          {modoAccion === 'aprobar' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Observación opcional antes de aprobar.
            </Typography>
          )}
          <TextField
            autoFocus
            label="Observación"
            fullWidth
            multiline
            minRows={3}
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            required={modoAccion === 'rechazar'}
            helperText={modoAccion === 'rechazar' ? 'Requerida para rechazar' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseModal} variant="outlined" color="inherit">Cancelar</Button>
          <Button
            onClick={handleEnviarAccion}
            variant="contained"
            color={modoAccion === 'aprobar' ? 'success' : 'error'}
            startIcon={modoAccion === 'aprobar' ? <CheckCircleIcon /> : <CancelIcon />}
          >
            {modoAccion === 'aprobar' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
