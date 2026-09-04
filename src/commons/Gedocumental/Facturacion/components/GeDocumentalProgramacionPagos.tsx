import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store/store";
import { Title } from "../../../../components/Title.tsx";
import {
  actualizar_numero_egreso,
  eliminar_factura_proveedor,
  get_facturas_usuario_filtrado,
  get_nits,
  subir_facturas_proveedor,
} from "../store/thunks/CajaFacturacionThunks.tsx";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import {
  TextField, Autocomplete, Button, debounce,
  Snackbar, Alert, FormControl, InputLabel, Select, MenuItem,
  DialogTitle, DialogContent, Dialog, DialogActions,
  IconButton, Tooltip, Card, CardContent, Box,
  Typography, Chip, Divider,
} from "@mui/material";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";
import { DataGrid, GridColDef, GridToolbarExport } from "@mui/x-data-grid";
import { Dayjs } from "dayjs";
import { CheckCircle, Cancel, Block, Close } from "@mui/icons-material";
import { green, red } from "@mui/material/colors";
import CONFIG from "../../../../config/api.js";
import AddBoxIcon from "@mui/icons-material/AddBox";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import CommentIcon from "@mui/icons-material/Comment";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SearchIcon from "@mui/icons-material/Search";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const HEADER_SX = {
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  "& .MuiDataGrid-columnHeaderTitle": { color: "#fff", fontWeight: 700 },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "rgba(255,255,255,0.7)" },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F5F3FF" },
  "& .MuiDataGrid-row.Mui-selected": { bgcolor: "#EDE9FE" },
  borderRadius: 2,
  border: "1px solid #E5E7EB",
};

const formatearFechaHora = (fechaString: string) => {
  if (!fechaString) return "";
  try {
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return fechaString;
    const d = fecha.getDate().toString().padStart(2, "0");
    const m = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const y = fecha.getFullYear();
    const h = fecha.getHours().toString().padStart(2, "0");
    const min = fecha.getMinutes().toString().padStart(2, "0");
    return `${d}/${m}/${y} ${h}:${min}`;
  } catch {
    return fechaString;
  }
};

export const GeDocumentalProgramacion = () => {
  const dispatch = useDispatch<AppDispatch>();
  const nitsData = useSelector((state: RootState) => state.caja_facturacion.nits);
  const facturasCreadas = useSelector((state: RootState) => state.caja_facturacion.archivos);
  const { users } = useSelector((state: RootState) => state.users);

  const [userSeleccionado, setUserSeleccionado] = useState<number | null>(null);
  const [revisorTesoreria, setRevisorTesoreria] = useState<number | null>(null);
  const [revisorTesoreriaSegundo, setRevisorTesoreriaSegundo] = useState<number | null>(null);
  const [selectedNit, setSelectedNit] = useState<{ label: string; value: string } | null>(null);
  const [inputValueNit, setInputValueNit] = useState<string>("");
  const [alerta, setAlerta] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({ open: false, msg: "", type: "success" });
  const [userId, setUserId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [documentoEgreso, setDocumentoEgreso] = useState<string>("");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<number | null>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [nitBusqueda, setNitBusqueda] = useState<string>("");
  const [modalObservacionesOpen, setModalObservacionesOpen] = useState(false);
  const [observacionesSeleccionadas, setObservacionesSeleccionadas] = useState<string[]>([]);

  const nitOptions = nitsData.map((nit) => ({
    label: nit.NombreNit || "Sin nombre",
    value: nit.CuentaNit.toString(),
  }));

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData.id);
    }
  }, []);

  useEffect(() => {
    dispatch(get_users());
  }, [dispatch]);

  const handleSearchNit = debounce(async (value: string) => {
    if (value.length > 2) await dispatch(get_nits(value));
  }, 500);

  const consultarFacturasUsuario = async () => {
    if (!userId) return;
    await dispatch(
      get_facturas_usuario_filtrado({
        idUsuario: userId,
        fechaInicio: fechaInicio?.format("YYYY-MM-DD"),
        fechaFin: fechaFin?.format("YYYY-MM-DD"),
        estado: estadoFiltro as any,
        numeroAdmision: nitBusqueda,
      })
    );
  };

  const handleVerDocumento = (idArchivo: number) => {
    window.open(`${API_ENDPOINT}/gedocumental/descargar/${idArchivo}/`, "_blank");
  };

  const handleGuardarDocumento = async () => {
    if (!facturaSeleccionada || !documentoEgreso.trim()) return;
    const response = await dispatch(
      actualizar_numero_egreso({ idArchivo: facturaSeleccionada, numeroDocumento: documentoEgreso.trim() })
    ).unwrap();
    if (response?.success) {
      setModalOpen(false);
      setDocumentoEgreso("");
      setFacturaSeleccionada(null);
      await consultarFacturasUsuario();
    }
  };

  const handleEliminarFactura = async (idArchivo: number) => {
    const resultado = await dispatch(eliminar_factura_proveedor(idArchivo));
    if (resultado) await consultarFacturasUsuario();
  };

  const columns: GridColDef[] = [
    { field: "TipoHallazgo", headerName: "Proveedor", width: 280, headerAlign: "center", align: "center" },
    {
      field: "FechaCreacionArchivo", headerName: "Fecha Creación", width: 145, headerAlign: "center", align: "center",
      valueFormatter: (p) => formatearFechaHora(p.value),
    },
    {
      field: "Admision_id", headerName: "Comprobante", width: 110, headerAlign: "center", align: "center",
      renderCell: (p) => p.value && p.value !== 0 ? p.value : "—",
    },
    {
      field: "IdRevisor", headerName: "Revisor 1", width: 180, headerAlign: "center", align: "center",
      renderCell: (p) => {
        const u = users.find((u) => u.id === p.value);
        return <span>{u?.nombre || u?.username || "Sin asignar"}</span>;
      },
    },
    {
      field: "RevisionPrimera", headerName: "Aprob. 1", width: 90, headerAlign: "center", align: "center",
      renderCell: (p) => {
        if (p.value) return <CheckCircle style={{ color: green[500] }} />;
        if (p.row.FechaRechazo && p.row.UsuarioRechazo === p.row.IdRevisor) return <Close style={{ color: red[500] }} />;
        return <Block style={{ color: red[200] }} />;
      },
    },
    {
      field: "FechaRevisionPrimera", headerName: "Fecha Rev. 1", width: 145, headerAlign: "center", align: "center",
      valueFormatter: (p) => formatearFechaHora(p.value),
    },
    {
      field: "IdRevisorTesoreria", headerName: "Revisor 2", width: 160, headerAlign: "center", align: "center",
      renderCell: (p) => {
        const u = users.find((u) => u.id === p.value);
        return <span>{u?.nombre || u?.username || "—"}</span>;
      },
    },
    {
      field: "RevisionSegunda", headerName: "Aprob. 2", width: 90, headerAlign: "center", align: "center",
      renderCell: (p) => {
        if (!p.row.IdRevisorTesoreria) return null;
        if (p.value) return <CheckCircle style={{ color: green[500] }} />;
        if (p.row.FechaRechazo && p.row.UsuarioRechazo === p.row.IdRevisorTesoreria) return <Close style={{ color: red[500] }} />;
        return <Block style={{ color: red[200] }} />;
      },
    },
    {
      field: "FechaRevisionSegunda", headerName: "Fecha Rev. 2", width: 145, headerAlign: "center", align: "center",
      valueFormatter: (p) => formatearFechaHora(p.value),
    },
    {
      field: "UsuarioCuentasMedicas", headerName: "Revisor 3", width: 160, headerAlign: "center", align: "center",
      renderCell: (p) => {
        const u = users.find((u) => u.id === p.value);
        return <span>{u?.nombre || u?.username || "—"}</span>;
      },
    },
    {
      field: "RevisionTercera", headerName: "Aprob. 3", width: 90, headerAlign: "center", align: "center",
      renderCell: (p) => {
        if (!p.row.UsuarioCuentasMedicas) return null;
        if (p.value) return <CheckCircle style={{ color: green[500] }} />;
        if (p.row.FechaRechazo && p.row.UsuarioRechazo === p.row.UsuarioCuentasMedicas) return <Close style={{ color: red[500] }} />;
        return <Block style={{ color: red[200] }} />;
      },
    },
    {
      field: "FechaRechazo", headerName: "Fecha Rechazo", width: 145, headerAlign: "center", align: "center",
      valueFormatter: (p) => formatearFechaHora(p.value),
    },
    {
      field: "UsuarioRechazo", headerName: "Rechazado por", width: 150, headerAlign: "center", align: "center",
      renderCell: (p) => {
        if (!p.value) return <span>—</span>;
        const u = users.find((u) => u.id === p.value);
        return <span>{u?.nombre || u?.username || `Usuario ${p.value}`}</span>;
      },
    },
    {
      field: "verObservaciones", headerName: "", width: 50, sortable: false,
      renderCell: (p) => {
        const obs = p.row.Observaciones || [];
        return obs.length > 0 ? (
          <Tooltip title="Ver observaciones" arrow>
            <IconButton size="small" sx={{ color: "#08717A" }} onClick={() => {
              setObservacionesSeleccionadas(obs.map((o: { Descripcion: string }) => o.Descripcion));
              setModalObservacionesOpen(true);
            }}>
              <CommentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null;
      },
      align: "center", headerAlign: "center",
    },
    {
      field: "egreso", headerName: "", width: 50, sortable: false,
      renderCell: (p) =>
        p.row.RevisionPrimera ? (
          <Tooltip title="Agregar comprobante" arrow>
            <IconButton size="small" sx={{ color: "#1E2E71" }} onClick={() => {
              setFacturaSeleccionada(p.row.IdArchivo);
              setModalOpen(true);
            }}>
              <AddBoxIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null,
      align: "center", headerAlign: "center",
    },
    {
      field: "verDocumento", headerName: "", width: 50, sortable: false,
      renderCell: (p) => (
        <Tooltip title="Ver documento" arrow>
          <IconButton size="small" sx={{ color: "#381A73" }} onClick={() => handleVerDocumento(p.row.IdArchivo)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
      align: "center", headerAlign: "center",
    },
    {
      field: "acciones", headerName: "", width: 50, sortable: false,
      renderCell: (p) =>
        userId === 227 ? null : (
          <Tooltip title="Eliminar factura" arrow>
            <IconButton size="small" color="error" onClick={() => handleEliminarFactura(p.row.IdArchivo)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      align: "center", headerAlign: "center",
    },
  ];

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Title title={'GESTIÓN DOCUMENTAL - PROGRAMACIÓN DE PAGOS'} />

        {/* ── Sección carga ── */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
          <Box sx={{
            px: 2.5, py: 1.5,
            background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
            display: "flex", alignItems: "center", gap: 1,
          }}>
            <UploadFileIcon sx={{ color: "rgba(255,255,255,0.8)", fontSize: 18 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
              Cargar factura de proveedor
            </Typography>
          </Box>
          <CardContent sx={{ pt: 2.5, pb: "16px !important" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 2 }}>
              <Autocomplete
                options={nitOptions}
                getOptionLabel={(o) => o.label || ""}
                isOptionEqualToValue={(o, v) => o.value === v?.value}
                value={selectedNit}
                inputValue={inputValueNit}
                onInputChange={(_, v) => { setInputValueNit(v); handleSearchNit(v); }}
                onChange={(_, v) => setSelectedNit(v || null)}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar y seleccionar NIT" size="small" />
                )}
              />
              <FormControl size="small">
                <InputLabel>Revisor</InputLabel>
                <Select value={userSeleccionado ?? ""} onChange={(e) => setUserSeleccionado(e.target.value as number)} label="Revisor">
                  <MenuItem value=""><em>Seleccione revisor</em></MenuItem>
                  {users?.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.nombre || u.username || `Usuario ${u.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Revisor 2 (opcional)</InputLabel>
                <Select
                  value={revisorTesoreria ?? ""}
                  onChange={(e) => setRevisorTesoreria(e.target.value as number)}
                  label="Revisor 2 (opcional)"
                  disabled={!userSeleccionado}
                >
                  <MenuItem value=""><em>Sin segundo revisor</em></MenuItem>
                  {users?.filter((u) => u.id !== userSeleccionado).map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.nombre || u.username || `Usuario ${u.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Revisor 3 (opcional)</InputLabel>
                <Select
                  value={revisorTesoreriaSegundo ?? ""}
                  onChange={(e) => setRevisorTesoreriaSegundo(e.target.value as number)}
                  label="Revisor 3 (opcional)"
                  disabled={!userSeleccionado}
                >
                  <MenuItem value=""><em>Sin tercer revisor</em></MenuItem>
                  {users?.filter((u) => u.id !== userSeleccionado).map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.nombre || u.username || `Usuario ${u.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                size="small"
                sx={{
                  borderStyle: "dashed", borderColor: archivos.length > 0 ? "#1E2E71" : "#D1D5DB",
                  color: archivos.length > 0 ? "#1E2E71" : "#6B7280",
                  minWidth: 200,
                }}
              >
                {archivos.length > 0 ? archivos[0].name : "Seleccionar PDF"}
                <input type="file" accept="application/pdf" hidden onChange={(e) => {
                  if (e.target.files) setArchivos(Array.from(e.target.files));
                }} />
              </Button>
              {archivos.length > 0 && (
                <Chip label={archivos[0].name} size="small" onDelete={() => setArchivos([])} sx={{ maxWidth: 220 }} />
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                disabled={!selectedNit || archivos.length === 0 || !userId || !userSeleccionado}
                sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)", px: 3 }}
                onClick={async () => {
                  const nitLimpio = selectedNit?.value?.replace(/\./g, "");
                  if (!nitLimpio || !userId || !userSeleccionado) return;
                  const resultado = await dispatch(
                    subir_facturas_proveedor(
                      nitLimpio, archivos, "FACTURAPROVEEDOR",
                      userId.toString(), userSeleccionado.toString(),
                      selectedNit?.label || "",
                      revisorTesoreria?.toString(),
                      revisorTesoreriaSegundo?.toString()
                    )
                  );
                  if (resultado && (resultado as any[]).length > 0) {
                    setAlerta({ open: true, msg: "Factura(s) cargada(s) correctamente", type: "success" });
                    setArchivos([]);
                  }
                }}
              >
                Guardar
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* ── Sección seguimiento ── */}
        <Card variant="outlined" sx={{ borderRadius: 2, border: "1px solid #E5E7EB" }}>
          <Box sx={{
            px: 2.5, py: 1.5,
            background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
            display: "flex", alignItems: "center", gap: 1,
          }}>
            <SearchIcon sx={{ color: "rgba(255,255,255,0.8)", fontSize: 18 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
              Seguimiento de facturas
            </Typography>
          </Box>
          <CardContent sx={{ pb: "16px !important" }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2, alignItems: "center" }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Fecha Inicio"
                  value={fechaInicio}
                  onChange={(v) => setFechaInicio(v)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Fecha Fin"
                  value={fechaFin}
                  onChange={(v) => setFechaFin(v)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </LocalizationProvider>
              <Autocomplete
                options={nitOptions}
                getOptionLabel={(o) => o.label || ""}
                isOptionEqualToValue={(o, v) => o.value === v?.value}
                value={nitOptions.find((n) => n.value === nitBusqueda) || null}
                onChange={(_, v) => setNitBusqueda(v ? v.value : "")}
                onInputChange={(_, v) => handleSearchNit(v)}
                renderInput={(params) => <TextField {...params} label="Buscar por NIT" size="small" />}
                sx={{ width: 280 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Estado</InputLabel>
                <Select value={estadoFiltro ?? ""} onChange={(e) => setEstadoFiltro(e.target.value)} label="Estado">
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="aprobada">Aprobada</MenuItem>
                  <MenuItem value="rechazada">Rechazada</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={consultarFacturasUsuario}
                startIcon={<SearchIcon />}
                sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
              >
                Buscar
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <DataGrid
              sx={HEADER_SX}
              density="compact"
              autoHeight
              rowHeight={72}
              columns={columns}
              getRowId={(row) => row.IdArchivo}
              rows={facturasCreadas}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              slots={{ toolbar: GridToolbarExport }}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Modal: comprobante */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} PaperProps={{ sx: { width: 400, borderRadius: 3 } }}>
        <DialogTitle sx={{
          background: "linear-gradient(90deg, #1E2E71, #0F4374)",
          color: "#fff", fontWeight: 700, fontSize: 15,
        }}>
          Ingresar número de comprobante
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Número de documento"
            fullWidth
            value={documentoEgreso}
            onChange={(e) => setDocumentoEgreso(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarDocumento}
            sx={{ background: "linear-gradient(90deg, #1E2E71, #0F4374)" }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: observaciones */}
      <Dialog open={modalObservacionesOpen} onClose={() => setModalObservacionesOpen(false)} PaperProps={{ sx: { width: 480, borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 15 }}>Observaciones</DialogTitle>
        <DialogContent dividers>
          {observacionesSeleccionadas.map((obs, i) => (
            <Box key={i} sx={{
              mb: 1.5, p: 1.5, borderRadius: 1.5,
              bgcolor: "#F9FAFB", border: "1px solid #E5E7EB",
              fontSize: 14, whiteSpace: "pre-wrap",
            }}>
              {obs}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalObservacionesOpen(false)} variant="outlined" color="inherit">Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alerta.open} autoHideDuration={4000} onClose={() => setAlerta({ ...alerta, open: false })}>
        <Alert severity={alerta.type} onClose={() => setAlerta({ ...alerta, open: false })}>
          {alerta.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GeDocumentalProgramacion;
