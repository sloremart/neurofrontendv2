import React, { useCallback, useEffect, useState } from "react";
import {
  DataGrid, GridToolbarContainer, GridToolbarExport, type GridColDef,
} from "@mui/x-data-grid";
import { Box, Button, Chip, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CONFIG from "../../../../config/api.js";
import { formatoHoras } from "../../HallazgosIA/HallazgosIA.tsx";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

type EstadoIA = "listas" | "documentos_incompletos" | "esperando_resultado" | "con_hallazgos" | "sin_revision_ia" | "todas";

interface FilaBandeja {
  Admision: number;
  Paciente: string;
  Identificacion: string;
  Entidad: string;
  Contrato: string;
  Documentos: number;
  RevisadosIA: number;
  HallazgosIA: number;
  EstadoIA: Exclude<EstadoIA, "todas">;
  TieneResultado: boolean;
  TieneFactura: boolean;
  DiasDesdeIngreso: number | null;
  PacienteCompleto: boolean | null;
  DatosFaltantes: string[];
  DevueltaCM: boolean;
  UsuarioCargue: string;
  UltimoCargue: string | null;
  HorasEsperando: number;
}

interface Resumen {
  listas: number;
  documentos_incompletos: number;
  esperando_resultado: number;
  con_hallazgos: number;
  sin_revision_ia: number;
  paciente_incompleto: number;
}

const ESTADOS: { valor: EstadoIA; texto: string; color: "success" | "default" | "error" | "primary" | "info"; ayuda: string }[] = [
  { valor: "listas", texto: "Pre-auditadas", color: "success",
    ayuda: "Tienen ORDEN, AUTORIZACION, COMPROBANTE y RESULTADO, revisados por la IA sin hallazgos. Listas para cargar factura y auditar." },
  { valor: "documentos_incompletos", texto: "Documentos incompletos", color: "default",
    ayuda: "Les falta ORDEN, AUTORIZACION o COMPROBANTE." },
  { valor: "esperando_resultado", texto: "Esperando resultado", color: "info",
    ayuda: "Sin hallazgos, pero el RESULTADO aún no se ha cargado. Si pasan 5 días se notifica a la coordinación médica." },
  { valor: "con_hallazgos", texto: "Con hallazgos IA", color: "error",
    ayuda: "Tienen al menos un documento con hallazgo IA pendiente de corregir" },
  { valor: "sin_revision_ia", texto: "Sin revisión IA", color: "default",
    ayuda: "Sin hallazgos, pero la IA no revisó todos sus documentos (cargados antes de activarla, ilegibles, etc.)" },
  { valor: "todas", texto: "Todas", color: "primary", ayuda: "Todas las admisiones con documentos pendientes de aprobar" },
];

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

const fechaISO = (d: Date) => d.toISOString().split("T")[0];

function Toolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport csvOptions={{ utf8WithBom: true, fileName: "bandeja_cuentas_medicas" }}
        printOptions={{ disableToolbarButton: true }} />
    </GridToolbarContainer>
  );
}

export const BandejaCuentasMedicas = ({ onAbrir }: { onAbrir: (admision: number) => void }) => {
  const [desde, setDesde] = useState(fechaISO(new Date(Date.now() - 30 * 86400000)));
  const [hasta, setHasta] = useState(fechaISO(new Date()));
  const [estado, setEstado] = useState<EstadoIA>("listas");
  const [filas, setFilas] = useState<FilaBandeja[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(false);

  const consultar = useCallback(async (estadoConsulta: EstadoIA = estado) => {
    const params = new URLSearchParams({ fecha_inicio: desde, fecha_fin: hasta, estado: estadoConsulta });
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINT}/gedocumental/bandeja-cuentas-medicas/?${params}`);
      const json = await res.json();
      setFilas(json.success ? json.data : []);
      setResumen(json.success ? json.resumen : null);
    } catch {
      setFilas([]);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, estado]);

  useEffect(() => { consultar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarEstado = (nuevo: EstadoIA) => {
    setEstado(nuevo);
    consultar(nuevo);
  };

  const conteo = (valor: EstadoIA) => {
    if (!resumen) return null;
    if (valor === "todas")
      return resumen.listas + resumen.documentos_incompletos + resumen.esperando_resultado
        + resumen.con_hallazgos + resumen.sin_revision_ia;
    return resumen[valor];
  };

  const columnas: GridColDef<FilaBandeja>[] = [
    {
      field: "HorasEsperando", headerName: "Esperando", width: 110, type: "number", headerAlign: "left", align: "left",
      renderCell: ({ row }) => (
        <Tooltip title={row.UltimoCargue ? `Último cargue: ${new Date(row.UltimoCargue).toLocaleString("es-CO")}` : ""} arrow>
          <Chip size="small" label={formatoHoras(row.HorasEsperando)} sx={{ fontWeight: 700 }}
            color={row.HorasEsperando >= 72 ? "error" : row.HorasEsperando >= 24 ? "warning" : "success"} />
        </Tooltip>
      ),
    },
    {
      field: "Admision", headerName: "Admisión", width: 100,
      renderCell: ({ row }) => (
        <Tooltip title="Abrir para revisar" arrow>
          <Button size="small" onClick={() => onAbrir(row.Admision)} sx={{ fontWeight: 700, minWidth: 0 }}>
            {row.Admision}
          </Button>
        </Tooltip>
      ),
    },
    { field: "Paciente", headerName: "Paciente", flex: 1, minWidth: 180 },
    { field: "Identificacion", headerName: "Identificación", width: 115 },
    { field: "Contrato", headerName: "Entidad / Contrato", width: 230 },
    { field: "Documentos", headerName: "Docs.", width: 65, type: "number" },
    {
      field: "TieneResultado", headerName: "Resultado", width: 120,
      valueGetter: ({ row }) => (row.TieneResultado ? "Cargado" : "Pendiente"),
      renderCell: ({ row }) => row.TieneResultado
        ? <Chip size="small" label="Cargado" color="success" variant="outlined" />
        : (
          <Tooltip title={row.DiasDesdeIngreso !== null ? `${row.DiasDesdeIngreso} días desde el ingreso` : ""} arrow>
            <Chip size="small" variant="outlined"
              label={row.DiasDesdeIngreso !== null ? `Pendiente (${row.DiasDesdeIngreso} d)` : "Pendiente"}
              color={row.DiasDesdeIngreso !== null && row.DiasDesdeIngreso >= 5 ? "error" : "info"} />
          </Tooltip>
        ),
    },
    {
      field: "EstadoIA", headerName: "Revisión IA", width: 150,
      valueGetter: ({ row }) =>
        row.HallazgosIA ? `${row.HallazgosIA} hallazgo(s)` : `${row.RevisadosIA}/${row.Documentos} revisados`,
      renderCell: ({ row, value }) => (
        <Chip size="small" label={value} sx={{ fontWeight: 600 }}
          color={row.EstadoIA === "con_hallazgos" ? "error" : row.EstadoIA === "sin_revision_ia" ? "default" : "success"}
          variant={row.EstadoIA === "sin_revision_ia" ? "outlined" : "filled"} />
      ),
    },
    {
      field: "DevueltaCM", headerName: "Devuelta CM", width: 105,
      valueGetter: ({ row }) => (row.DevueltaCM ? "Sí" : ""),
      renderCell: ({ row }) => row.DevueltaCM
        ? <Tooltip title="Cuentas Médicas ya le hizo una observación" arrow><Chip size="small" label="Sí" color="warning" /></Tooltip>
        : null,
    },
    { field: "UsuarioCargue", headerName: "Cargado por", width: 150 },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 1 }}>
        <TextField label="Cargue desde" type="date" size="small" value={desde}
          onChange={(e) => setDesde(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Hasta" type="date" size="small" value={hasta}
          onChange={(e) => setHasta(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" startIcon={<SearchIcon />} onClick={() => consultar()} disabled={loading}
          sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}>
          Consultar
        </Button>
      </Box>

      <Tabs value={estado} onChange={(_, v) => cambiarEstado(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 1, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 }, "& .Mui-selected": { color: "#381A73 !important" },
              "& .MuiTabs-indicator": { backgroundColor: "#381A73", height: 3 } }}>
        {ESTADOS.filter((e) => e.valor === "listas").map((e) => (  // Cuentas Médicas solo trabaja las pre-auditadas
          <Tab key={e.valor} value={e.valor} label={
            <Tooltip title={e.ayuda} arrow>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {e.texto}
                {conteo(e.valor) !== null && (
                  <Chip size="small" label={conteo(e.valor)} color={e.color} sx={{ height: 20, fontWeight: 700 }} />
                )}
              </Box>
            </Tooltip>
          } />
        ))}
      </Tabs>

      {estado === "listas" && (
        <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 1 }}>
          Admisiones pre-auditadas: tienen ORDEN, AUTORIZACION, COMPROBANTE y RESULTADO, y pasaron la revisión de la IA sin hallazgos. Solo falta cargar la FACTURA y auditar. Las más antiguas primero.
        </Typography>
      )}


      <DataGrid
        rows={filas}
        columns={columnas}
        getRowId={(r) => r.Admision}
        loading={loading}
        autoHeight
        density="compact"
        slots={{ toolbar: Toolbar }}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        localeText={{ noRowsLabel: "No hay admisiones en esta bandeja para el rango de fechas" }}
        disableRowSelectionOnClick
        onRowClick={(p) => onAbrir(p.row.Admision)}
        sx={{ ...HEADER_SX, "& .MuiDataGrid-row": { cursor: "pointer" } }}
      />
    </Box>
  );
};

export default BandejaCuentasMedicas;
