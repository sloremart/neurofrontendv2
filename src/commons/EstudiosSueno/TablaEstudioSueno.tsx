import React, { useEffect, useState } from "react";
import {
  DataGrid, GridToolbarContainer, GridToolbarExport,
  type GridColDef, type GridRowModel,
} from "@mui/x-data-grid";
import {
  Box, Button, Card, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Checkbox, FormControlLabel, Autocomplete,
  IconButton, Tooltip,
} from "@mui/material";
import AddIcon           from "@mui/icons-material/Add";
import FilterAltIcon     from "@mui/icons-material/FilterAlt";
import EditIcon          from "@mui/icons-material/Edit";
import DeleteIcon        from "@mui/icons-material/Delete";
import SearchIcon        from "@mui/icons-material/Search";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import HighlightOffIcon  from "@mui/icons-material/HighlightOff";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store.ts";
import { Title } from "../../components/Title.tsx";
import {
  cargar_catalogos, cargar_registros, crear_registro,
  actualizar_registro, eliminar_registro, buscar_pacientes_agenda,
  control_error,
} from "./store/thunks/EstudiosSuenoThunks.tsx";

const HEADER_SX = {
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    color: "#fff", fontSize: 12, fontWeight: 700,
  },
  "& .MuiDataGrid-columnHeaderTitle": { color: "#fff", fontWeight: 700 },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "rgba(255,255,255,0.7)" },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F5F3FF" },
  borderRadius: 2, border: "1px solid #E5E7EB",
};

const SectionHeader = ({ label }: { label: string }) => (
  <Box sx={{
    px: 2.5, py: 1.5,
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    borderRadius: "8px 8px 0 0",
  }}>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{label}</Typography>
  </Box>
);

const EMPTY_FORM = {
  fecha_realizacion: dayjs().format("YYYY-MM-DD"),
  equipo: "",
  nombres_completos: "",
  fecha_nacimiento: "",
  numero_documento: "",
  estudio_realizado: "",
  especialista: "",
  entidad: "",
  tecnico: "",
  lectura_examen: false,
  observaciones: "",
};

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport
        csvOptions={{ utf8WithBom: true, delimiter: ",", fileName: "consolidado_sueno" }}
        printOptions={{ disableToolbarButton: true }}
      />
    </GridToolbarContainer>
  );
}

export const TablaEstudioSueno: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { registros, especialistas, tecnicos, estudios, equipos, entidades } =
    useSelector((s: RootState) => s.estudios_sueno);

  const [loading, setLoading]               = useState(false);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [agendaOpen, setAgendaOpen]         = useState(false);
  const [editId, setEditId]                 = useState<number | null>(null);
  const [form, setForm]                     = useState({ ...EMPTY_FORM });
  const [fechaInicio, setFechaInicio]       = useState<Dayjs | null>(dayjs());
  const [fechaFin, setFechaFin]             = useState<Dayjs | null>(dayjs());
  const [agendaRows, setAgendaRows]         = useState<any[]>([]);
  const [agendaFechaI, setAgendaFechaI]     = useState<Dayjs | null>(dayjs());
  const [agendaFechaF, setAgendaFechaF]     = useState<Dayjs | null>(dayjs());

  useEffect(() => { dispatch(cargar_catalogos()); }, [dispatch]);

  const handleFiltrar = async () => {
    if (!fechaInicio || !fechaFin) { control_error("Seleccione rango de fechas"); return; }
    setLoading(true);
    await dispatch(cargar_registros(fechaInicio.format("YYYY-MM-DD"), fechaFin.format("YYYY-MM-DD")));
    setLoading(false);
  };

  const handleOpenNuevo = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setDialogOpen(true); };
  const handleOpenEditar = (row: any) => {
    setForm({
      fecha_realizacion: row.fecha_realizacion ?? "",
      equipo:            row.equipo ?? "",
      nombres_completos: row.nombres_completos ?? "",
      fecha_nacimiento:  row.fecha_nacimiento ?? "",
      numero_documento:  row.numero_documento ?? "",
      estudio_realizado: row.estudio_realizado ?? "",
      especialista:      row.especialista ?? "",
      entidad:           row.entidad ?? "",
      tecnico:           row.tecnico ?? "",
      lectura_examen:    row.lectura_examen ?? false,
      observaciones:     row.observaciones ?? "",
    });
    setEditId(row.id);
    setDialogOpen(true);
  };

  const handleGuardar = async () => {
    if (!form.fecha_realizacion || !form.estudio_realizado || !form.especialista || !form.tecnico) {
      control_error("Complete los campos obligatorios"); return;
    }
    setLoading(true);
    if (editId) {
      await dispatch(actualizar_registro(editId, form));
    } else {
      await dispatch(crear_registro(form));
    }
    setDialogOpen(false);
    await dispatch(cargar_registros(
      fechaInicio?.format("YYYY-MM-DD") ?? dayjs().format("YYYY-MM-DD"),
      fechaFin?.format("YYYY-MM-DD")    ?? dayjs().format("YYYY-MM-DD"),
    ));
    setLoading(false);
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este registro?")) return;
    setLoading(true);
    await dispatch(eliminar_registro(id));
    await dispatch(cargar_registros(
      fechaInicio?.format("YYYY-MM-DD") ?? dayjs().format("YYYY-MM-DD"),
      fechaFin?.format("YYYY-MM-DD")    ?? dayjs().format("YYYY-MM-DD"),
    ));
    setLoading(false);
  };

  const handleBuscarAgenda = async () => {
    if (!agendaFechaI || !agendaFechaF) { control_error("Seleccione rango de fechas"); return; }
    setLoading(true);
    const rows = await dispatch(buscar_pacientes_agenda(
      agendaFechaI.format("YYYY-MM-DD"),
      agendaFechaF.format("YYYY-MM-DD"),
    ));
    setAgendaRows(rows as any[]);
    setLoading(false);
  };

  const handleUsarPaciente = (row: any) => {
    setForm(f => ({
      ...f,
      nombres_completos: row.nombres_completos ?? "",
      fecha_nacimiento:  row.fecha_nacimiento  ? dayjs(row.fecha_nacimiento).format("YYYY-MM-DD") : "",
      numero_documento:  row.numero_documento  ?? "",
      entidad:           row.entidad           ?? "",
    }));
    setAgendaOpen(false);
    setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: "fecha_realizacion",  headerName: "Fecha Realización", width: 130, headerAlign: "center", align: "center" },
    { field: "equipo",             headerName: "Equipo",            width: 110, headerAlign: "center", align: "center" },
    { field: "nombres_completos",  headerName: "Paciente",          width: 230, flex: 1 },
    { field: "numero_documento",   headerName: "Documento",         width: 120, headerAlign: "center", align: "center" },
    { field: "estudio_realizado",  headerName: "Estudio",           width: 200 },
    { field: "especialista",       headerName: "Especialista",      width: 190 },
    { field: "entidad",            headerName: "Entidad",           width: 160 },
    { field: "tecnico",            headerName: "Técnico",           width: 180 },
    {
      field: "lectura_examen", headerName: "Lectura", width: 90,
      headerAlign: "center", align: "center",
      renderCell: (p) => p.value
        ? <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 20 }} />
        : <HighlightOffIcon sx={{ color: "#EF4444", fontSize: 20 }} />,
    },
    {
      field: "acciones", headerName: "Acciones", width: 100,
      headerAlign: "center", align: "center", sortable: false,
      renderCell: (p) => (
        <>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => handleOpenEditar(p.row)}>
              <EditIcon fontSize="small" sx={{ color: "#1E2E71" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => handleEliminar(p.row.id)}>
              <DeleteIcon fontSize="small" sx={{ color: "#EF4444" }} />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  const agendaColumns: GridColDef[] = [
    { field: "admision",          headerName: "Admisión",  width: 100 },
    { field: "nombres_completos", headerName: "Paciente",  width: 250, flex: 1 },
    { field: "numero_documento",  headerName: "Documento", width: 130 },
    { field: "entidad",           headerName: "Entidad",   width: 180 },
    { field: "descripcion_cups",  headerName: "Estudio",   width: 280 },
    {
      field: "usar", headerName: "", width: 80, sortable: false,
      renderCell: (p) => (
        <Button size="small" onClick={() => handleUsarPaciente(p.row)} sx={{ fontSize: 10 }}>Usar</Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Title title="CONSOLIDADO ESTUDIO DE SUEÑO" />

      {/* Filtros */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader label="Filtros" />
        <CardContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Fecha inicio" value={fechaInicio} onChange={setFechaInicio}
                slotProps={{ textField: { size: "small" } }} />
              <DatePicker label="Fecha fin"    value={fechaFin}    onChange={setFechaFin}
                slotProps={{ textField: { size: "small" } }} />
            </LocalizationProvider>
            <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={handleFiltrar} disabled={loading}
              sx={{ borderColor: "#1E2E71", color: "#1E2E71" }}>
              Filtrar
            </Button>
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={() => setAgendaOpen(true)}
              sx={{ borderColor: "#0F4374", color: "#0F4374" }}>
              Buscar en agenda
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenNuevo}
              sx={{ background: "linear-gradient(90deg,#381A73,#1E2E71)", ml: "auto" }}>
              Nuevo registro
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card variant="outlined" sx={{ borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader label={`Registros (${registros.length})`} />
        <CardContent>
          <DataGrid
            sx={HEADER_SX}
            density="compact"
            autoHeight
            columns={columns}
            rows={registros}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
            slots={{ toolbar: CustomToolbar }}
          />
        </CardContent>
      </Card>

      {/* Dialog nuevo/editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: "linear-gradient(90deg,#381A73,#1E2E71)", color: "#fff", fontSize: 14 }}>
          {editId ? "Editar registro" : "Nuevo registro"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 1 }}>
            <TextField label="Fecha de realización" type="date" size="small"
              value={form.fecha_realizacion}
              onChange={e => setForm(f => ({ ...f, fecha_realizacion: e.target.value }))}
              InputLabelProps={{ shrink: true }} required />

            <FormControl size="small" required>
              <InputLabel>Equipo</InputLabel>
              <Select value={form.equipo} label="Equipo"
                onChange={e => setForm(f => ({ ...f, equipo: e.target.value }))}>
                {equipos.map(eq => <MenuItem key={eq.value} value={eq.value}>{eq.label}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Nombre del paciente" size="small" fullWidth
              value={form.nombres_completos}
              onChange={e => setForm(f => ({ ...f, nombres_completos: e.target.value }))}
              required sx={{ gridColumn: "span 2" }} />

            <TextField label="Número de documento" size="small"
              value={form.numero_documento}
              onChange={e => setForm(f => ({ ...f, numero_documento: e.target.value }))} />

            <TextField label="Fecha de nacimiento" type="date" size="small"
              value={form.fecha_nacimiento}
              onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))}
              InputLabelProps={{ shrink: true }} />

            <FormControl size="small" required>
              <InputLabel>Estudio realizado</InputLabel>
              <Select value={form.estudio_realizado} label="Estudio realizado"
                onChange={e => setForm(f => ({ ...f, estudio_realizado: e.target.value }))}>
                {estudios.map(es => <MenuItem key={es.value} value={es.value}>{es.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" required>
              <InputLabel>Especialista</InputLabel>
              <Select value={form.especialista} label="Especialista"
                onChange={e => setForm(f => ({ ...f, especialista: e.target.value }))}>
                {especialistas.map(esp => (
                  <MenuItem key={esp.codigo} value={esp.nombre}>
                    {esp.nombre} — {esp.especialidad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ gridColumn: "span 2" }}>
              <InputLabel>Entidad</InputLabel>
              <Select value={form.entidad} label="Entidad"
                onChange={e => setForm(f => ({ ...f, entidad: e.target.value }))}>
                {entidades.map(e => (
                  <MenuItem key={e.nombre} value={e.nombre}>{e.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" required>
              <InputLabel>Técnico</InputLabel>
              <Select value={form.tecnico} label="Técnico"
                onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))}>
                {tecnicos.map(t => (
                  <MenuItem key={t.email} value={t.nombre}>{t.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox checked={form.lectura_examen}
                  onChange={e => setForm(f => ({ ...f, lectura_examen: e.target.checked }))} />
              }
              label="Lectura de examen" />

            <TextField label="Observaciones" size="small" multiline rows={2}
              sx={{ gridColumn: "span 2" }}
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={loading}
            sx={{ background: "linear-gradient(90deg,#381A73,#1E2E71)" }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog agenda */}
      <Dialog open={agendaOpen} onClose={() => setAgendaOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ background: "linear-gradient(90deg,#381A73,#1E2E71)", color: "#fff", fontSize: 14 }}>
          Pacientes en agenda — Estudios de sueño (CUPS 891703 / 891704 / 891901)
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center", pt: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Desde" value={agendaFechaI} onChange={setAgendaFechaI}
                slotProps={{ textField: { size: "small" } }} />
              <DatePicker label="Hasta" value={agendaFechaF} onChange={setAgendaFechaF}
                slotProps={{ textField: { size: "small" } }} />
            </LocalizationProvider>
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleBuscarAgenda} disabled={loading}
              sx={{ borderColor: "#1E2E71", color: "#1E2E71" }}>
              Buscar
            </Button>
          </Box>
          <DataGrid
            sx={HEADER_SX}
            density="compact"
            autoHeight
            columns={agendaColumns}
            rows={agendaRows}
            getRowId={r => r.admision}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgendaOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
