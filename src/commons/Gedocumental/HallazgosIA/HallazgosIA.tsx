import React, { useCallback, useEffect, useState } from "react";
import { DataGrid, GridToolbarContainer, GridToolbarExport, type GridColDef } from "@mui/x-data-grid";
import {
  Box, Button, Card, Chip, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip, Typography,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CONFIG from "../../../config/api.js";
import { Title } from "../../../components/Title.tsx";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const TIPOS_HALLAZGO = [
  "INFORMACION", "AUTORIZACION", "SOPORTES", "REPORTE",
  "FARMACIA", "TARIFA", "CONTRATO", "RECAUDO",
];

const RESOLUCIONES: Record<string, string> = {
  CORREGIDO: "Corregido",
  REEMPLAZADO: "Nueva revisión",
  ARCHIVO_ELIMINADO: "Archivo eliminado",
};

const HEADER_SX = {
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    color: "#fff", fontSize: 12, fontWeight: 700,
  },
  "& .MuiDataGrid-columnHeaderTitle": { color: "#fff", fontWeight: 700 },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "rgba(255,255,255,0.7)" },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F5F3FF" },
  "& .MuiDataGrid-cell": { alignItems: "flex-start", py: 1 },
  borderRadius: 2, border: "1px solid #E5E7EB",
};

/** "3 d 4 h" a partir de horas */
export const formatoHoras = (horas: number) => {
  if (horas < 1) return "< 1 h";
  const d = Math.floor(horas / 24);
  const h = horas % 24;
  return d > 0 ? `${d} d${h ? ` ${h} h` : ""}` : `${h} h`;
};

/** Tiempo que lleva abierto un hallazgo: verde < 1 día, naranja 1-3 días, rojo > 3 días */
export const TiempoAbierto = ({ horas, resuelta }: { horas: number; resuelta: boolean }) => {
  if (resuelta) {
    return <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Corregido en {formatoHoras(horas)}</Typography>;
  }
  const color = horas >= 72 ? "error" : horas >= 24 ? "warning" : "success";
  return <Chip label={formatoHoras(horas)} size="small" color={color} sx={{ fontWeight: 700 }} />;
};

interface Hallazgo {
  IdRevision: number;
  IdArchivo: number | null;
  Admision: number;
  Paciente: string;
  Identificacion: string;
  Entidad: string;
  TipoDocumento: string;
  TipoHallazgo: string;
  Descripcion: string;
  Modo: string;
  Usuario: string;
  Fecha: string;
  Resuelta: boolean;
  Resolucion: string | null;
  FechaResolucion: string | null;
  HorasAbierto: number;
}

interface Resumen {
  revisados: number;
  con_hallazgo: number;
  pendientes: number;
  admisiones_afectadas: number;
}

const hoy = () => new Date().toISOString().split("T")[0];
const haceDias = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
const formatoFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "";

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport
        csvOptions={{ utf8WithBom: true, delimiter: ",", fileName: "hallazgos_ia" }}
        printOptions={{ disableToolbarButton: true }}
      />
    </GridToolbarContainer>
  );
}

const Indicador = ({ label, valor, color }: { label: string; valor: number | string; color: string }) => (
  <Card sx={{ flex: "1 1 160px", p: 2, borderTop: `4px solid ${color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
    <Typography sx={{ fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>{label}</Typography>
    <Typography sx={{ fontSize: 26, fontWeight: 700, color: "#111827" }}>{valor}</Typography>
  </Card>
);

export const HallazgosIA: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState(haceDias(30));
  const [fechaFin, setFechaFin] = useState(hoy());
  const [estado, setEstado] = useState("pendiente");
  const [tipo, setTipo] = useState("");
  const [admision, setAdmision] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [filas, setFilas] = useState<Hallazgo[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = useCallback(async () => {
    const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, estado });
    if (tipo) params.append("tipo", tipo);
    if (admision.trim()) params.append("admision", admision.trim());
    if (soloMios) {
      try {
        const ud = JSON.parse(localStorage.getItem("userData") || "{}");
        if (ud.id) params.append("usuario_id", String(ud.id));
      } catch { /* sin usuario en sesión */ }
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_ENDPOINT}/gedocumental/hallazgos-ia/?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.detail || "Error consultando hallazgos");
      setFilas(json.data);
      setResumen(json.resumen);
    } catch (e: any) {
      setError(e.message);
      setFilas([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, estado, tipo, admision, soloMios]);

  useEffect(() => { consultar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const columnas: GridColDef[] = [
    { field: "Fecha", headerName: "Fecha", width: 130, valueFormatter: ({ value }) => formatoFecha(value as string) },
    {
      field: "HorasAbierto", headerName: "Tiempo sin corregir", width: 150, type: "number", headerAlign: "left", align: "left",
      renderCell: ({ row }) => <TiempoAbierto horas={row.HorasAbierto} resuelta={row.Resuelta} />,
    },
    { field: "Admision", headerName: "Admisión", width: 95 },
    { field: "Paciente", headerName: "Paciente", width: 200 },
    { field: "Identificacion", headerName: "Identificación", width: 120 },
    { field: "Entidad", headerName: "EPS", width: 90 },
    { field: "TipoDocumento", headerName: "Documento", width: 130 },
    {
      field: "TipoHallazgo", headerName: "Hallazgo", width: 155,
      renderCell: ({ value }) => <Chip label={value} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />,
    },
    {
      field: "Descripcion", headerName: "Descripción", flex: 1, minWidth: 320,
      renderCell: ({ value, row }) => (
        <Tooltip title={row.Modo ? `Leído como: ${row.Modo}` : ""} arrow>
          <Typography sx={{ fontSize: 13, whiteSpace: "normal", lineHeight: 1.4 }}>{value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: "Usuario", headerName: "Responsable", width: 170,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ fontSize: 13 }}>{row.Usuario}</Typography>
          {row.Modo === "sistema" && <Typography sx={{ fontSize: 11, color: "#6B7280" }}>Resultado faltante</Typography>}
        </Box>
      ),
    },
    {
      field: "Resuelta", headerName: "Estado", width: 150,
      valueGetter: ({ row }) => (row.Resuelta ? RESOLUCIONES[row.Resolucion ?? ""] ?? "Resuelto" : "Pendiente"),
      renderCell: ({ value, row }) => (
        <Tooltip title={row.FechaResolucion ? formatoFecha(row.FechaResolucion) : ""} arrow>
          <Chip label={value} size="small" color={row.Resuelta ? "success" : "warning"} />
        </Tooltip>
      ),
    },
    {
      field: "IdArchivo", headerName: "Ver", width: 70, sortable: false, disableExport: true,
      renderCell: ({ value }) => value ? (
        <Button size="small" onClick={() => window.open(`${API_ENDPOINT}/gedocumental/descargar/${value}/`, "_blank")}>
          <VisibilityIcon fontSize="small" />
        </Button>
      ) : null,
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Title title="HALLAZGOS DE REVISIÓN IA" />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", my: 2 }}>
        <Indicador label="Documentos revisados" valor={resumen?.revisados ?? "–"} color="#381A73" />
        <Indicador label="Con hallazgo" valor={resumen?.con_hallazgo ?? "–"} color="#DC2626" />
        <Indicador label="Pendientes" valor={resumen?.pendientes ?? "–"} color="#F59E0B" />
        <Indicador label="Admisiones en la lista" valor={resumen?.admisiones_afectadas ?? "–"} color="#0F4374" />
      </Box>

      <Card sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <SmartToyIcon sx={{ color: "#381A73" }} />
        <TextField label="Desde" type="date" size="small" value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Hasta" type="date" size="small" value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)} InputLabelProps={{ shrink: true }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <MenuItem value="pendiente">Pendientes</MenuItem>
            <MenuItem value="resuelto">Resueltos</MenuItem>
            <MenuItem value="todos">Todos</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tipo hallazgo</InputLabel>
          <Select label="Tipo hallazgo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {TIPOS_HALLAZGO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <Chip
          label="Asignados a mí"
          color={soloMios ? "primary" : "default"}
          variant={soloMios ? "filled" : "outlined"}
          onClick={() => setSoloMios((v) => !v)}
        />
        <TextField label="Admisión" size="small" value={admision} sx={{ width: 120 }}
          onChange={(e) => setAdmision(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") consultar(); }} />
        <Button variant="contained" startIcon={<FilterAltIcon />} onClick={consultar} disabled={loading}
          sx={{ background: "linear-gradient(90deg, #381A73 0%, #1E2E71 100%)" }}>
          Consultar
        </Button>
      </Card>

      {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}

      <Box sx={{ height: 600, bgcolor: "#fff" }}>
        <DataGrid
          rows={filas}
          columns={columnas}
          getRowId={(r) => r.IdRevision}
          getRowHeight={() => "auto"}
          loading={loading}
          slots={{ toolbar: CustomToolbar }}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={HEADER_SX}
          localeText={{ noRowsLabel: "Sin hallazgos para los filtros seleccionados" }}
        />
      </Box>
    </Box>
  );
};

export default HallazgosIA;
