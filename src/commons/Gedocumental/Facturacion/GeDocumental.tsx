/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Title } from "../../../components/Title.tsx";
import { PrimeReactProvider } from "primereact/api";
import { IAdmisiones } from "../../interfaces/GeDocumental.ts";
import { Checkbox } from "@mui/material";
import { AdmsionFacturacion } from "../../../components/AdmisionArchivos.tsx";
import CONFIG from "../../../config/api.js";
import { toast } from "react-toastify";
import { TablaFacturacionPendientes } from "./components/TablaFacturacionPendientes.tsx";
import { ObservacionRevisada } from "../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import { get_users } from "../../Login/store/thunks/ThunksLogin.tsx";
import { AppDispatch, RootState } from "../../../store/store.ts";
import { DataGrid, GridRenderCellParams, GridToolbarExport } from "@mui/x-data-grid";
import { green } from "@mui/material/colors";
import {
  Box, Card, CardContent, Typography, TextField,
  Button, IconButton, Tooltip, Chip, Divider,
  Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import BadgeIcon from "@mui/icons-material/Badge";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CommentIcon from "@mui/icons-material/Comment";
import ListAltIcon from "@mui/icons-material/ListAlt";

interface Observacion {
  AdmisionId: number;
  Descripcion: string;
  TipoArchivo: string;
  FechaObservacion: string;
  id: number;
  Revisada: boolean;
}

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

const CardHeader = ({
  icon, label, collapsible, open, onToggle,
}: {
  icon: React.ReactNode; label: string;
  collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) => (
  <Box
    onClick={collapsible ? onToggle : undefined}
    sx={{
      px: 2.5, py: 1.5,
      background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
      display: "flex", alignItems: "center", gap: 1,
      borderRadius: open === false ? 2 : "8px 8px 0 0",
      cursor: collapsible ? "pointer" : "default",
      userSelect: "none",
    }}
  >
    <Box sx={{ color: "rgba(255,255,255,0.8)", display: "flex", fontSize: 18 }}>{icon}</Box>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3, flex: 1 }}>
      {label}
    </Typography>
    {collapsible && (
      open
        ? <ExpandLessIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }} />
        : <ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }} />
    )}
  </Box>
);

export const GeDocumental = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useSelector((state: RootState) => state.users);

  const [consecutivo, setConsecutivo] = useState<string>("");
  const [admisionData, setAdmisionData] = useState<IAdmisiones | null>(null);
  const [archivos, setArchivos] = useState<{ file: File; tipoDocumento: any }[]>([]);
  const [archivosCargados, setArchivosCargados] = useState<{ [key: string]: boolean }>({});
  const [botonesGuardadoHabilitados, setBotonesGuardadoHabilitados] = useState<{ [key: string]: boolean }>({});
  const [enviarArchivos, setEnviarArchivos] = useState(false);
  const [archivosCargadosInfo, setArchivosCargadosInfo] = useState<{ [key: string]: string }>({});
  const [regimen, setRegimen] = useState("");
  const [botonContributivoDisabled, setBotonContributivoDisabled] = useState(false);
  const [botonSubsidiadoDisabled, setBotonSubsidiadoDisabled] = useState(false);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [isLider, setIsLider] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [pendientesOpen, setPendientesOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  useEffect(() => {
    if (enviarArchivos) {
      archivos.forEach((archivo) => {
        handleGuardarArchivos([archivo], archivo.tipoDocumento);
        setBotonesGuardadoHabilitados((prev) => ({ ...prev, [archivo.tipoDocumento]: true }));
      });
      setEnviarArchivos(false);
    }
  }, [archivos, enviarArchivos]);

  useEffect(() => {
    if (admisionData) {
      const initialState = admisionData.TiposDocumentos.reduce(
        (acc: Record<string, boolean>, t: string) => { acc[t] = false; return acc; },
        {} as Record<string, boolean>
      );
      setBotonesGuardadoHabilitados(initialState);
    }
  }, [admisionData]);

  const handleCheckboxChange = async (admisionId: number) => {
    if (!admisionId) return;
    try {
      await ObservacionRevisada(admisionId);
      handleFetchObservaciones();
    } catch (error) {
      console.error("Error al actualizar la observación:", error instanceof Error ? error.message : error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/gedocumental/admisiones/${consecutivo}/`);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const responseData = await response.json();
      const data = responseData.data;
      setAdmisionData(data);
      if (data.ContratoRegimen === 1) handleRegimenChange("C");
      else if (data.ContratoRegimen === 2) handleRegimenChange("S");
      else {
        const alias = (data.ContratoAlias || "").toUpperCase();
        if (alias.includes("CONTRIBUTIVO")) handleRegimenChange("C");
        else if (alias.includes("SUBSIDIADO")) handleRegimenChange("S");
      }
      toast.success("Datos de admisión obtenidos correctamente", { autoClose: 3000 });
    } catch {
      toast.error("Error al obtener la información de la admisión", { autoClose: 3000 });
    }
  };

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData.id);
      setSelectedUserId(userData.id);
      if (userData.cargo === "LIDERFACTURACION") { setIsLider(true); dispatch(get_users()); }
    }
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, tipoDocumento: string) => {
    const uploadedFiles: File[] = Array.from(event.target.files ?? []);
    setArchivos((prev) => [...prev, ...uploadedFiles.map((file) => ({ file, tipoDocumento }))]);
    const fileNames = uploadedFiles.map((f) => f.name).join(", ");
    setArchivosCargados((prev) => ({ ...prev, [tipoDocumento]: true }));
    setArchivosCargadosInfo((prev) => ({
      ...prev,
      [tipoDocumento]: prev[tipoDocumento] ? prev[tipoDocumento] + ", " + fileNames : fileNames,
    }));
  };

  const handleEliminarArchivo = (tipoDocumento: string) => {
    setArchivos((prev) => prev.filter((a) => a.tipoDocumento !== tipoDocumento));
    setArchivosCargados((prev) => ({ ...prev, [tipoDocumento]: false }));
    setArchivosCargadosInfo((prev) => { const { [tipoDocumento]: _, ...rest } = prev; return rest; });
  };

  const handleGuardarArchivos = async (archivosAGuardar: { file: File; tipoDocumento: string }[], tipoDocumento: string) => {
    try {
      if (archivosAGuardar.length === 0) { toast.warn("No hay archivos para enviar."); return; }
      const userDataString = localStorage.getItem("userData");
      if (!userDataString) return;
      const userData = JSON.parse(userDataString);
      const formData = new FormData();
      archivosAGuardar.forEach((a) => { formData.append("files", a.file); formData.append("tipoDocumentos", a.tipoDocumento); });
      formData.append("consecutivo", consecutivo);
      formData.append("userId", userData.id);
      formData.append("regimen", regimen);
      const response = await fetch(`${API_ENDPOINT}/gedocumental/archivos/${consecutivo}/`, { method: "POST", body: formData });
      if (!response.ok) { const d = await response.json(); throw new Error(d.detail || `Error ${response.status}`); }
      toast.success("Archivos guardados correctamente.");
      setBotonesGuardadoHabilitados((prev) => ({ ...prev, [tipoDocumento]: true }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar archivos.");
    }
  };

  const handleRegimenChange = (r: string) => {
    setRegimen(r);
    setBotonContributivoDisabled(r === "C");
    setBotonSubsidiadoDisabled(r === "S");
  };

  const handleFetchObservaciones = async () => {
    setLoading(true);
    try {
      const targetId = selectedUserId || userId;
      const response = await fetch(`${API_ENDPOINT}/gedocumental/observaciones/${targetId}/`);
      const responseData = await response.json();
      if (!response.ok) throw new Error(`Error ${response.status}`);
      setObservaciones(responseData);
      if (responseData.length === 0) toast.info("No se encontraron observaciones pendientes.", { autoClose: 3000 });
      else toast.success(`${responseData.length} observación(es) encontrada(s).`, { autoClose: 3000 });
    } catch {
      toast.error("Error al obtener las observaciones.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const columnsObs = [
    {
      field: "no", headerName: "No.", width: 60,
      renderCell: (p: GridRenderCellParams<any>) => {
        const allRows = p.api.getSortedRowIds();
        return allRows.indexOf(p.id) + 1;
      },
    },
    { field: "AdmisionId", headerName: "Admisión ID", width: 110 },
    { field: "Descripcion", headerName: "Descripción", flex: 1, minWidth: 300 },
    { field: "TipoArchivo", headerName: "Tipo Archivo", width: 150 },
    {
      field: "FechaObservacion", headerName: "Fecha", width: 130,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : "",
    },
    {
      field: "Revisada", headerName: "Corregida", width: 100,
      renderCell: (p: any) => (
        <Checkbox
          checked={p.row.Revisada}
          onChange={() => handleCheckboxChange(p.row.AdmisionId)}
          sx={{ color: green[600], "&.Mui-checked": { color: green[600] } }}
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Title title={'MÓDULO DE GESTIÓN DOCUMENTAL FACTURACIÓN'} />

      {/* ── Buscar admisión ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <CardHeader icon={<SearchIcon />} label="Buscar admisión" />
        <CardContent sx={{ pb: "16px !important" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: admisionData ? 2.5 : 0 }}>
            <TextField
              label="Núm. estudio / admisión"
              value={consecutivo}
              onChange={(e) => setConsecutivo(e.target.value)}
              size="small"
              sx={{ width: 220 }}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
            <Button
              variant="contained"
              onClick={fetchData}
              startIcon={<SearchIcon />}
              sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
            >
              Buscar admisión
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Typography variant="body2" sx={{ color: "#6B7280", fontWeight: 600 }}>Régimen:</Typography>
            <Button
              variant={botonContributivoDisabled ? "contained" : "outlined"}
              disabled={botonContributivoDisabled}
              onClick={() => handleRegimenChange("C")}
              size="small"
              sx={botonContributivoDisabled ? { background: "#1E3A8A" } : {}}
            >
              Contributivo
            </Button>
            <Button
              variant={botonSubsidiadoDisabled ? "contained" : "outlined"}
              disabled={botonSubsidiadoDisabled}
              onClick={() => handleRegimenChange("S")}
              size="small"
              sx={botonSubsidiadoDisabled ? { background: "#1E3A8A" } : {}}
            >
              Subsidiado
            </Button>
          </Box>

          {admisionData && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr", gap: 2 }}>
                <TextField
                  label="Factura No"
                  value={`${admisionData.Prefijo || ""}${admisionData.FacturaNo}`}
                  InputProps={{ readOnly: true }}
                  size="small"
                  variant="filled"
                />
                <TextField
                  label="Entidad / Contrato"
                  value={admisionData.ContratoAlias || admisionData.NombreEntidad || admisionData.CodigoEntidad}
                  InputProps={{ readOnly: true }}
                  size="small"
                  variant="filled"
                />
                <TextField
                  label="Nombre completo"
                  value={admisionData.NombreCompleto || admisionData.NombreResponsable || ""}
                  InputProps={{ readOnly: true }}
                  size="small"
                  variant="filled"
                />
                <TextField
                  label="Identificación"
                  value={admisionData.IdPaciente}
                  InputProps={{ readOnly: true }}
                  size="small"
                  variant="filled"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Cargar documentos ── */}
      {admisionData && (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
          <CardHeader icon={<UploadFileIcon />} label="Cargar documentos" />
          <CardContent sx={{ pb: "16px !important" }}>
            {admisionData.TiposDocumentos.map((tipoDocumento, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex", alignItems: "center", gap: 2, mb: 1.5,
                  p: 1.5, borderRadius: 1.5,
                  bgcolor: archivosCargados[tipoDocumento] ? "#F0FDF4" : "#FAFAFA",
                  border: "1px solid",
                  borderColor: archivosCargados[tipoDocumento] ? "#BBF7D0" : "#E5E7EB",
                }}
              >
                <input
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  id={`fileInput-${index}`}
                  multiple
                  type="file"
                  onChange={(e) => handleFileInputChange(e, tipoDocumento)}
                />
                <label htmlFor={`fileInput-${index}`}>
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                    startIcon={<UploadFileIcon />}
                    disabled={archivosCargados[tipoDocumento]}
                    sx={{ minWidth: 180, borderStyle: "dashed" }}
                  >
                    {tipoDocumento}
                  </Button>
                </label>

                <Box sx={{ flex: 1 }}>
                  {archivosCargadosInfo[tipoDocumento] ? (
                    <Chip
                      label={archivosCargadosInfo[tipoDocumento]}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ maxWidth: "100%", fontWeight: 600 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: "#9CA3AF", fontSize: 12 }}>
                      Sin archivo seleccionado
                    </Typography>
                  )}
                </Box>

                <Tooltip title="Guardar" arrow>
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={botonesGuardadoHabilitados[tipoDocumento]}
                      onClick={() =>
                        handleGuardarArchivos(
                          archivos.filter((a) => a.tipoDocumento === tipoDocumento),
                          tipoDocumento
                        )
                      }
                      sx={{ bgcolor: "#EEF2FF", "&:hover": { bgcolor: "#E0E7FF" } }}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Eliminar" arrow>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleEliminarArchivo(tipoDocumento)}
                    sx={{ bgcolor: "#FEF2F2", "&:hover": { bgcolor: "#FEE2E2" } }}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Admisiones pendientes (colapsable) ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <CardHeader
          icon={<ListAltIcon />}
          label="Listado de admisiones pendientes"
          collapsible
          open={pendientesOpen}
          onToggle={() => setPendientesOpen(p => !p)}
        />
        <Collapse in={pendientesOpen} timeout="auto" unmountOnExit>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TablaFacturacionPendientes
              userId={isLider ? selectedUserId : undefined}
              isLider={isLider}
              users={users}
              selectedUserId={selectedUserId}
              onUserChange={(id) => { setSelectedUserId(id); setObservaciones([]); }}
            />
          </CardContent>
        </Collapse>
      </Card>

      {/* ── Observaciones pendientes (colapsable) ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <CardHeader
          icon={<CommentIcon />}
          label="Observaciones pendientes sin archivos"
          collapsible
          open={obsOpen}
          onToggle={() => setObsOpen(p => !p)}
        />
        <Collapse in={obsOpen} timeout="auto" unmountOnExit>
          <CardContent sx={{ pb: "16px !important" }}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleFetchObservaciones}
                startIcon={<CommentIcon />}
                sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
              >
                Consultar observaciones
              </Button>
            </Box>
            <DataGrid
              sx={HEADER_SX}
              rows={observaciones}
              columns={columnsObs}
              getRowId={(row) => row.id}
              loading={loading}
              density="compact"
              autoHeight
              pageSizeOptions={[25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              slots={{ toolbar: GridToolbarExport }}
            />
          </CardContent>
        </Collapse>
      </Card>

      {/* ── Consulta de archivos guardados ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <CardHeader icon={<BadgeIcon />} label="Consulta de archivos guardados" />
        <CardContent sx={{ pb: "16px !important" }}>
          <PrimeReactProvider>
            <AdmsionFacturacion />
          </PrimeReactProvider>
        </CardContent>
      </Card>
    </Box>
  );
};
