import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbarContainer, GridToolbarExport, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, MenuItem, Select, FormControl, InputLabel,
  Box, Card, CardContent, Typography,
} from "@mui/material";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  control_error, get_admisiones_radicar, get_codigos,
  renombrar_capitalsalud, renombrar_colsanitas, renombrar_compensar,
  renombrar_medisanitas, renombrar_otros, renombrar_saludtotal,
  renombrar_san02, renombrar_sanitasevento, renombrar_fomag,
  renombrar_policia, renombrar_ejercito,
} from "../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import { Title } from "../../../components/Title.tsx";
import { AppDispatch, RootState } from "../../../store/store.ts";

const HEADER_SX = {
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    color: "#fff", fontSize: 12, fontWeight: 700,
  },
  "& .MuiDataGrid-columnHeaderTitle": { color: "#fff", fontWeight: 700 },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "rgba(255,255,255,0.7)" },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F5F3FF" },
  "& .MuiDataGrid-row.Mui-selected": { bgcolor: "#EDE9FE" },
  borderRadius: 2, border: "1px solid #E5E7EB",
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

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport
        csvOptions={{ utf8WithBom: true, delimiter: ",", fileName: "radicacion" }}
        printOptions={{ disableToolbarButton: true }}
      />
    </GridToolbarContainer>
  );
}

export const TablaRadicacion = () => {
  const { admision_cuentas_medicas } = useSelector((state: RootState) => state.talento_humano);
  const dispatch = useDispatch();

  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(null);
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [codigos, setCodigos] = useState<{ codigo: string; nombre: string }[]>([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [idusuario, setIdusuario] = useState<string | null>(null);

  useEffect(() => {
    const ud = localStorage.getItem("userData");
    if (ud) setIdusuario(JSON.parse(ud).id);
  }, []);

  useEffect(() => {
    const fetchCodigos = async () => {
      try {
        setLoading(true);
        const data = await dispatch(get_codigos());
        setCodigos(data);
      } catch { /* errors shown by thunk */ } finally {
        setLoading(false);
      }
    };
    fetchCodigos();
  }, [dispatch]);

  const handleActionButtonClick = async (codigoEntidad: string, admisionId: number, dispatch: AppDispatch) => {
    if (!idusuario) return;
    const thunkMap: Record<string, any> = {
      "SALUD TOTAL CONTRIBUTIVO": renombrar_saludtotal,
      "SALUD TOTAL SUBSIDIADO": renombrar_saludtotal,
      "SANITAS EVENTO CONTRIBUTIVO": renombrar_sanitasevento,
      "SANITAS EVENTO SUBSIDIADO": renombrar_sanitasevento,
      "SANITAS MRC CONTRIBUTIVO": renombrar_san02,
      "SANITAS MRC SUBSIDIADO": renombrar_san02,
      "COLSANITAS PLAN MODULAR": renombrar_colsanitas,
      "COLSANITAS BANCO DE LA REPUBLICA": renombrar_colsanitas,
      "COLSANITAS PLAN INTEGRAL": renombrar_colsanitas,
      "CAPITAL SALUD CONTRIBUTIVO": renombrar_capitalsalud,
      "CAPITAL SALUD SUBSIDIADO": renombrar_capitalsalud,
      "COMPENSAR CONTRIBUTIVO": renombrar_compensar,
      "COMPENSAR SUBSIDIADO": renombrar_compensar,
      "FOMAG": renombrar_fomag,
      "POLICIA FISIATRIA 084-7-200075-25": renombrar_policia,
      "POLICIA ESTUDIOS DEL SUEÑO 084-7-200098-25": renombrar_policia,
      "PONAL MEDICINA LABORAL": renombrar_policia,
      "MEDISANITAS": renombrar_medisanitas,
      "EJERCITO": renombrar_ejercito,
    };
    const thunk = thunkMap[codigoEntidad] ?? renombrar_otros;
    await dispatch(thunk(admisionId, idusuario));
  };

  const handleFilterClick = async () => {
    if (!codigoSeleccionado || !selectedDateInicio || !selectedDateFin) {
      control_error("Debe seleccionar una fecha de inicio, una fecha de fin y un código");
      return;
    }
    try {
      setLoading(true);
      const result = await dispatch(
        get_admisiones_radicar(
          codigoSeleccionado,
          (selectedDateInicio as any).toISOString().split("T")[0],
          (selectedDateFin as any).toISOString().split("T")[0]
        )
      );
      if (!result.success) control_error(result.detail);
    } catch {
      control_error("Error en la consulta de admisiones");
    } finally {
      setLoading(false);
    }
  };

  const handleRadicarTodasAdmisiones = async () => {
    if (!idusuario) return;
    setLoading(true);
    try {
      for (const admision of admision_cuentas_medicas) {
        const codigo = admision.ContratoAlias || admision.CodigoEntidad || "";
        if (codigo && admision.AdmisionId) {
          await handleActionButtonClick(codigo, admision.AdmisionId, dispatch as AppDispatch);
        }
      }
    } catch { /* errors shown by thunks */ } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "AdmisionId", headerName: "Núm. Admisión", width: 130, headerAlign: "center", align: "center" },
    { field: "ContratoAlias", headerName: "Contrato", width: 260, flex: 1 },
    { field: "NombreResponsable", headerName: "Nombre del paciente", width: 280, flex: 1 },
    {
      field: "RevisionCuentasMedicas", headerName: "Auditoría C. Médicas", width: 170,
      headerAlign: "center", align: "center",
      renderCell: (p) => p.value
        ? <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 20 }} />
        : <HighlightOffIcon sx={{ color: "#EF4444", fontSize: 20 }} />,
    },
    { field: "FechaCreacionAntares", headerName: "Fecha Creación Antares", width: 190, headerAlign: "center", align: "center" },
    { field: "FechaCreacionArchivo", headerName: "Fecha Creación Archivo", width: 190, headerAlign: "center", align: "center" },
    {
      field: "Radicado", headerName: "Renombrado", width: 120,
      headerAlign: "center", align: "center",
      renderCell: (p) => p.value
        ? <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 20 }} />
        : <HighlightOffIcon sx={{ color: "#EF4444", fontSize: 20 }} />,
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Title title="RENOMBRAMIENTO" />

      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader icon={<FilterAltIcon />} label="Filtros" />
        <CardContent sx={{ pb: "16px !important" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha Inicio"
                value={selectedDateInicio}
                onChange={(v) => setSelectedDateInicio(v)}
                slotProps={{ textField: { size: "small" } }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha Fin"
                value={selectedDateFin}
                onChange={(v) => setSelectedDateFin(v)}
                slotProps={{ textField: { size: "small" } }}
              />
            </LocalizationProvider>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Entidad</InputLabel>
              <Select
                value={codigoSeleccionado}
                onChange={(e) => setCodigoSeleccionado(e.target.value as string)}
                label="Entidad"
              >
                {codigos.map((c) => (
                  <MenuItem key={c.codigo} value={c.codigo}>{c.nombre} ({c.codigo})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={handleFilterClick}
              disabled={loading}
              sx={{ borderColor: "#1E2E71", color: "#1E2E71" }}
            >
              Filtrar
            </Button>
            <Button
              variant="contained"
              startIcon={<CreateNewFolderIcon />}
              onClick={handleRadicarTodasAdmisiones}
              disabled={loading || admision_cuentas_medicas.length === 0}
              sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)", ml: "auto" }}
            >
              Renombrar
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader icon={<FolderOpenIcon />} label="Listado de admisiones" />
        <CardContent sx={{ pb: "16px !important" }}>
          <DataGrid
            sx={HEADER_SX}
            density="compact"
            autoHeight
            columns={columns}
            loading={loading}
            getRowId={(row) => row.AdmisionId}
            rows={admision_cuentas_medicas}
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
            slots={{ toolbar: CustomToolbar }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
