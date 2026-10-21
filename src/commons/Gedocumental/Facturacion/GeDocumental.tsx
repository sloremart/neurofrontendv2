/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
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
  Tabs, Tab, CircularProgress,
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
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { getToken } from "../../../config/token.jsx";
import { TiempoAbierto } from "../HallazgosIA/HallazgosIA.tsx";

interface Observacion {
  AdmisionId: number;
  Descripcion: string;
  TipoArchivo: string;
  FechaObservacion: string;
  id: number;
  Revisada: boolean;
}

interface HallazgoIA {
  IdRevision: number;
  IdArchivo: number | null;
  Admision: number;
  Paciente: string;
  Procedimiento: string;
  TipoDocumento: string;
  TipoHallazgo: string;
  Descripcion: string;
  Fecha: string;
  Identificacion: string;
  Entidad: string;
  Resuelta: boolean;
  Resolucion: string | null;
  FechaResolucion: string | null;
  HorasAbierto: number;
}

const RESOLUCIONES_IA: Record<string, string> = {
  CORREGIDO: "Corregido",
  REEMPLAZADO: "Nueva revisión",
  ARCHIVO_ELIMINADO: "Archivo eliminado",
};

const formatoFechaIA = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

/**
 * Estado de pre-auditoría de la admisión (mismas reglas que la bandeja de Cuentas Médicas):
 * hallazgos IA pendientes → falta RESULTADO → documentos sin revisión IA → pre-auditada.
 * La FACTURA no cuenta: la carga Cuentas Médicas.
 */
const EstadoPreauditoria = ({ existentes, ia }: {
  existentes: { [tipo: string]: { IdArchivo: number; NombreArchivo: string }[] };
  ia: { [tipo: string]: { tipo: string; descripcion: string } | null };
}) => {
  const tipos = Object.keys(existentes).filter((t) => t !== "FACTURA" && existentes[t]?.length);
  if (!tipos.length) return null;
  const conHallazgo = tipos.filter((t) => ia[t] && !["OK", "REVISANDO"].includes(ia[t]!.tipo));
  const revisando = tipos.filter((t) => ia[t]?.tipo === "REVISANDO");
  const sinRevision = tipos.filter((t) => !ia[t]);
  const tieneResultado = !!existentes["RESULTADO"]?.length;
  const faltanDocumentos = ["ORDEN", "AUTORIZACION", "COMPROBANTE"].filter((t) => !existentes[t]?.length);

  let color = "#166534", fondo = "#F0FDF4", borde = "#BBF7D0", icono = <CheckCircleIcon sx={{ color: "#16A34A" }} />;
  let titulo = "Pre-auditada: ya está en la bandeja de Cuentas Médicas para auditar";
  let detalle = "Tiene ORDEN, AUTORIZACION, COMPROBANTE y RESULTADO revisados sin hallazgos. Cuentas Médicas carga la FACTURA.";
  if (conHallazgo.length) {
    color = "#991B1B"; fondo = "#FEF2F2"; borde = "#FCA5A5"; icono = <WarningAmberIcon sx={{ color: "#DC2626" }} />;
    titulo = `Tiene hallazgos por corregir: ${conHallazgo.join(", ")}`;
    detalle = "Use el botón Reemplazar del documento y suba el correcto.";
  } else if (revisando.length) {
    color = "#374151"; fondo = "#F9FAFB"; borde = "#E5E7EB"; icono = <SmartToyIcon sx={{ color: "#6B7280" }} />;
    titulo = `La IA está revisando: ${revisando.join(", ")}`;
    detalle = "Puede seguir trabajando. El resultado aparecerá en cada documento en unos segundos.";
  } else if (faltanDocumentos.length) {
    color = "#92400E"; fondo = "#FFFBEB"; borde = "#FCD34D"; icono = <WarningAmberIcon sx={{ color: "#D97706" }} />;
    titulo = `Faltan documentos: ${faltanDocumentos.join(", ")}`;
    detalle = "Para pasar a Cuentas Médicas debe tener ORDEN, AUTORIZACION, COMPROBANTE y RESULTADO.";
  } else if (!tieneResultado) {
    color = "#1E40AF"; fondo = "#EFF6FF"; borde = "#BFDBFE"; icono = <SmartToyIcon sx={{ color: "#2563EB" }} />;
    titulo = "Esperando RESULTADO";
    detalle = "Los documentos cargados están bien. Pasará a Cuentas Médicas cuando se cargue el RESULTADO.";
  } else if (sinRevision.length) {
    color = "#374151"; fondo = "#F9FAFB"; borde = "#E5E7EB"; icono = <SmartToyIcon sx={{ color: "#6B7280" }} />;
    titulo = `Sin revisión IA: ${sinRevision.join(", ")}`;
    detalle = "Estos documentos no fueron revisados por la IA (cargados antes de activarla o ilegibles).";
  }
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 2, p: 1.5, borderRadius: 2,
               bgcolor: fondo, border: `1px solid ${borde}` }}>
      {icono}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color }}>{titulo}</Typography>
        <Typography sx={{ fontSize: 12, color }}>{detalle}</Typography>
      </Box>
    </Box>
  );
};

const EtiquetaBandeja = ({ texto, cantidad, color }: {
  texto: string; cantidad: number; color: "primary" | "error" | "warning";
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {texto}
    {cantidad > 0 && <Chip label={cantidad} size="small" color={color} sx={{ height: 20, fontWeight: 700 }} />}
  </Box>
);

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
  icon, label, collapsible, open, onToggle, badge,
}: {
  icon: React.ReactNode; label: string;
  collapsible?: boolean; open?: boolean; onToggle?: () => void;
  badge?: React.ReactNode;
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
    {badge}
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
  const [bandeja, setBandeja] = useState(0);
  const { admision_pendientes_facturacion } = useSelector((state: RootState) => state.talento_humano);
  const [archivosExistentes, setArchivosExistentes] = useState<{ [tipo: string]: { IdArchivo: number; NombreArchivo: string }[] }>({});
  const [aiResultados, setAiResultados] = useState<{ [tipo: string]: { tipo: string; descripcion: string } | null }>({});
  // Archivos recién guardados cuya revisión IA (en segundo plano) aún no llega
  const pendientesIARef = useRef<Set<number>>(new Set());
  const [hayPendientesIA, setHayPendientesIA] = useState(false);
  const [hallazgosIA, setHallazgosIA] = useState<HallazgoIA[]>([]);
  const [hallazgosIALoading, setHallazgosIALoading] = useState(false);
  const [buscarAlCambiar, setBuscarAlCambiar] = useState(false);
  const [pendientesIA, setPendientesIA] = useState(0);
  const [filtroIA, setFiltroIA] = useState({ desde: "", hasta: "", estado: "pendiente" });

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

  const fetchArchivosExistentes = async (cons: string) => {
    try {
      const res = await fetch(`${API_ENDPOINT}/gedocumental/archivos-por-admision/${cons}/`);
      const data = await res.json();
      if (data.success) {
        const porTipo: { [tipo: string]: { IdArchivo: number; NombreArchivo: string }[] } = {};
        const revisiones: { [id: string]: { tipo: string; descripcion: string; resuelta: boolean } } =
          data.data.revision_ia || {};
        const iaPorTipo: { [tipo: string]: { tipo: string; descripcion: string } | null } = {};
        let llegaronRevisiones = false;
        for (const a of data.data.archivos) {
          if (!porTipo[a.Tipo]) porTipo[a.Tipo] = [];
          porTipo[a.Tipo].push({ IdArchivo: a.IdArchivo, NombreArchivo: a.NombreArchivo });
          // Estado IA del tipo: un hallazgo pendiente pesa más que un OK, y un OK más que "revisando"
          const r = revisiones[String(a.IdArchivo)];
          if (r) {
            if (pendientesIARef.current.delete(a.IdArchivo)) llegaronRevisiones = true;
            if (!iaPorTipo[a.Tipo] || ["OK", "REVISANDO"].includes(iaPorTipo[a.Tipo]!.tipo)) {
              iaPorTipo[a.Tipo] = { tipo: r.tipo, descripcion: r.descripcion };
            }
          } else if (pendientesIARef.current.has(a.IdArchivo) && !iaPorTipo[a.Tipo]) {
            iaPorTipo[a.Tipo] = { tipo: "REVISANDO", descripcion: "La IA está revisando el documento…" };
          }
        }
        setArchivosExistentes(porTipo);
        setAiResultados(iaPorTipo);
        setHayPendientesIA(pendientesIARef.current.size > 0);
        if (llegaronRevisiones) cargarHallazgosIA();
      }
    } catch {}
  };

  const handleReemplazar = async (tipo: string) => {
    const existentes = archivosExistentes[tipo] || [];
    const token = getToken();
    for (const a of existentes) {
      await fetch(`${API_ENDPOINT}/gedocumental/eliminar-archivo/?archivo_id=${a.IdArchivo}`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
    }
    setArchivosExistentes(prev => { const { [tipo]: _, ...rest } = prev; return rest; });
    setArchivosCargados(prev => ({ ...prev, [tipo]: false }));
    setBotonesGuardadoHabilitados(prev => ({ ...prev, [tipo]: false }));
    setArchivosCargadosInfo(prev => { const { [tipo]: _, ...rest } = prev; return rest; });
    setArchivos(prev => prev.filter(a => a.tipoDocumento !== tipo));
    setAiResultados(prev => { const { [tipo]: _, ...rest } = prev; return rest; });
    toast.info(`Archivo ${tipo} eliminado. Puede subir uno nuevo.`);
    cargarHallazgosIA();
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/gedocumental/admisiones/${consecutivo}/`);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const responseData = await response.json();
      const data = responseData.data;
      setAdmisionData(data);
      setArchivosExistentes({});
      if (data.ContratoRegimen === 1) handleRegimenChange("C");
      else if (data.ContratoRegimen === 2) handleRegimenChange("S");
      else {
        const alias = (data.ContratoAlias || "").toUpperCase();
        if (alias.includes("CONTRIBUTIVO")) handleRegimenChange("C");
        else if (alias.includes("SUBSIDIADO")) handleRegimenChange("S");
      }
      await fetchArchivosExistentes(consecutivo);
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
    setBotonesGuardadoHabilitados((prev) => ({ ...prev, [tipoDocumento]: false }));
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
      const responseData = await response.json();
      if (!response.ok) { throw new Error(responseData.detail || `Error ${response.status}`); }

      // La revisión IA corre en segundo plano en el servidor (ai_revision_pendiente)
      const archivosGuardados: { id: number; nombre: string; ai_revision_pendiente?: boolean }[] =
        responseData.data || [];
      const revisionPendiente = archivosGuardados.some((a) => a.ai_revision_pendiente);

      // El archivo ya está en el servidor: la fila pasa a "archivo existente" (con botón Reemplazar)
      // para poder corregirlo de inmediato si la IA encontró un problema.
      setArchivosExistentes((prev) => ({
        ...prev,
        [tipoDocumento]: [
          ...(prev[tipoDocumento] || []),
          ...archivosGuardados.map((a) => ({ IdArchivo: a.id, NombreArchivo: a.nombre })),
        ],
      }));
      setArchivos((prev) => prev.filter((a) => a.tipoDocumento !== tipoDocumento));
      setArchivosCargados((prev) => ({ ...prev, [tipoDocumento]: false }));
      setArchivosCargadosInfo((prev) => { const { [tipoDocumento]: _, ...rest } = prev; return rest; });

      if (revisionPendiente) {
        archivosGuardados.forEach((a) => pendientesIARef.current.add(a.id));
        setHayPendientesIA(true);
        setAiResultados((prev) => ({
          ...prev, [tipoDocumento]: { tipo: "REVISANDO", descripcion: "La IA está revisando el documento…" },
        }));
        toast.success("Archivo guardado. La IA lo revisará en unos segundos.", { autoClose: 2500 });
      } else {
        setAiResultados((prev) => { const { [tipoDocumento]: _, ...rest } = prev; return rest; });
        toast.success("Archivos guardados correctamente.", { autoClose: 2500 });
      }
      setBotonesGuardadoHabilitados((prev) => ({ ...prev, [tipoDocumento]: false }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar archivos.");
    }
  };

  useEffect(() => {
    if (!hayPendientesIA || !consecutivo) return;
    const inicio = Date.now();
    const id = setInterval(() => {
      if (Date.now() - inicio > 3 * 60 * 1000) { clearInterval(id); return; }
      fetchArchivosExistentes(consecutivo);
    }, 4000);
    return () => clearInterval(id);
  }, [hayPendientesIA, consecutivo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de admisión se dejan de seguir las revisiones de la anterior
  useEffect(() => {
    pendientesIARef.current.clear();
    setHayPendientesIA(false);
  }, [admisionData?.Consecutivo]);

  // Hallazgos de la IA sobre los archivos que subió el usuario (o el elegido por el líder)
  const cargarHallazgosIA = async () => {
    const targetId = selectedUserId || userId;
    if (!targetId) return;
    setHallazgosIALoading(true);
    try {
      const params = new URLSearchParams({ usuario_id: String(targetId), estado: filtroIA.estado });
      if (filtroIA.desde) params.append("fecha_inicio", filtroIA.desde);
      if (filtroIA.hasta) params.append("fecha_fin", filtroIA.hasta);
      const [resTabla, resPend] = await Promise.all([
        fetch(`${API_ENDPOINT}/gedocumental/hallazgos-ia/?${params}`),
        // El contador siempre muestra todos los pendientes, sin importar los filtros
        fetch(`${API_ENDPOINT}/gedocumental/hallazgos-ia/?estado=pendiente&usuario_id=${targetId}`),
      ]);
      const tabla = await resTabla.json();
      const pend = await resPend.json();
      setHallazgosIA(tabla.success ? tabla.data : []);
      setPendientesIA(pend.success ? pend.data.length : 0);
    } catch {
      setHallazgosIA([]);
    } finally {
      setHallazgosIALoading(false);
    }
  };

  useEffect(() => {
    cargarHallazgosIA();
    if (selectedUserId || userId) handleFetchObservaciones(true);
  }, [userId, selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegimenChange = (r: string) => {
    setRegimen(r);
    setBotonContributivoDisabled(r === "C");
    setBotonSubsidiadoDisabled(r === "S");
  };

  const handleFetchObservaciones = async (silencioso = false) => {
    setLoading(true);
    try {
      const targetId = selectedUserId || userId;
      const response = await fetch(`${API_ENDPOINT}/gedocumental/observaciones/${targetId}/`);
      const responseData = await response.json();
      if (!response.ok) throw new Error(`Error ${response.status}`);
      setObservaciones(responseData);
      if (silencioso) return;
      if (responseData.length === 0) toast.info("No se encontraron observaciones pendientes.", { autoClose: 3000 });
      else toast.success(`${responseData.length} observación(es) encontrada(s).`, { autoClose: 3000 });
    } catch {
      if (!silencioso) toast.error("Error al obtener las observaciones.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // "Abrir" desde el panel de hallazgos IA: carga la admisión en el buscador y la consulta
  useEffect(() => {
    if (buscarAlCambiar && consecutivo) { setBuscarAlCambiar(false); fetchData(); }
  }, [consecutivo, buscarAlCambiar]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirAdmision = (admision: number) => {
    setConsecutivo(String(admision));
    setBuscarAlCambiar(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columnsHallazgosIA = [
    {
      field: "Fecha", headerName: "Fecha hallazgo", width: 125,
      valueFormatter: ({ value }: { value: string }) => formatoFechaIA(value),
    },
    {
      field: "HorasAbierto", headerName: "Tiempo sin corregir", width: 145, type: "number", headerAlign: "left" as const, align: "left" as const,
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => <TiempoAbierto horas={p.row.HorasAbierto} resuelta={p.row.Resuelta} />,
    },
    {
      field: "Admision", headerName: "Admisión", width: 100,
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => (
        <Tooltip title="Abrir admisión para corregir" arrow>
          <Button size="small" onClick={() => abrirAdmision(p.row.Admision)} sx={{ fontWeight: 700, minWidth: 0 }}>
            {p.row.Admision}
          </Button>
        </Tooltip>
      ),
    },
    { field: "Paciente", headerName: "Paciente", width: 170 },
    {
      field: "Procedimiento", headerName: "Procedimiento (CUPS)", width: 240,
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => (
        <Typography sx={{ fontSize: 12, whiteSpace: "normal", lineHeight: 1.35 }}>{p.row.Procedimiento}</Typography>
      ),
    },
    { field: "Identificacion", headerName: "Identificación", width: 110 },
    { field: "Entidad", headerName: "EPS", width: 80 },
    { field: "TipoDocumento", headerName: "Documento", width: 135 },
    {
      field: "TipoHallazgo", headerName: "Hallazgo", width: 155,
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => (
        <Chip label={p.row.TipoHallazgo} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
      ),
    },
    {
      field: "Descripcion", headerName: "Descripción", flex: 1, minWidth: 260,
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => (
        <Typography sx={{ fontSize: 13, whiteSpace: "normal", lineHeight: 1.4 }}>{p.row.Descripcion}</Typography>
      ),
    },
    {
      field: "Resuelta", headerName: "Estado", width: 130,
      valueGetter: (p: { row: HallazgoIA }) =>
        p.row.Resuelta ? RESOLUCIONES_IA[p.row.Resolucion ?? ""] ?? "Resuelto" : "Pendiente",
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => (
        <Chip label={p.value} size="small" color={p.row.Resuelta ? "success" : "warning"} />
      ),
    },
    {
      field: "FechaResolucion", headerName: "Fecha corrección", width: 125,
      valueFormatter: ({ value }: { value: string | null }) => formatoFechaIA(value),
    },
    {
      field: "IdArchivo", headerName: "Ver", width: 60, sortable: false, disableExport: true,
      renderCell: (p: GridRenderCellParams<HallazgoIA>) => p.row.IdArchivo ? (
        <Tooltip title="Ver documento" arrow>
          <IconButton size="small" onClick={() => window.open(`${API_ENDPOINT}/gedocumental/descargar/${p.row.IdArchivo}/`, "_blank")}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ];

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

              {/* Datos del paciente incompletos en ZeusSalud */}
              {admisionData.ValidacionPaciente && (
                admisionData.ValidacionPaciente.completo ? (
                  <Box sx={{ mt: 2, px: 2, py: 1, borderRadius: 2, bgcolor: "#F0FDF4", border: "1px solid #BBF7D0",
                             display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 18 }} />
                    <Typography sx={{ fontSize: 13, color: "#166534" }}>Datos del paciente completos.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "#FFFBEB", border: "1px solid #FCD34D" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <WarningAmberIcon sx={{ color: "#D97706", fontSize: 20 }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>
                        Datos del paciente incompletos en ZeusSalud
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "#92400E", mb: 1.5 }}>
                      Actualice estos datos en la ficha del paciente antes de facturar:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {admisionData.ValidacionPaciente.faltantes.map((f) => (
                        <Tooltip key={f.campo} title={f.motivo} arrow>
                          <Chip
                            label={f.obligatorio ? f.campo : `${f.campo} (recomendado)`}
                            size="small"
                            color={f.obligatorio ? "error" : "warning"}
                            variant={f.obligatorio ? "filled" : "outlined"}
                            sx={{ fontWeight: 600 }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Cargar documentos ── */}
      {admisionData && (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
          <CardHeader icon={<UploadFileIcon />} label="Cargar documentos" />
          <CardContent sx={{ pb: "16px !important" }}>
            <EstadoPreauditoria existentes={archivosExistentes} ia={aiResultados} />
            {admisionData.TiposDocumentos.map((tipoDocumento, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex", alignItems: "center", gap: 2, mb: 1.5,
                  p: 1.5, borderRadius: 1.5,
                  bgcolor: aiResultados[tipoDocumento] != null && aiResultados[tipoDocumento]!.tipo !== "OK"
                    ? "#FFF5F5"
                    : aiResultados[tipoDocumento]?.tipo === "OK"
                    ? "#F0FDF4"
                    : archivosCargados[tipoDocumento] ? "#F0FDF4" : "#FAFAFA",
                  border: "1px solid",
                  borderColor: aiResultados[tipoDocumento] != null && aiResultados[tipoDocumento]!.tipo !== "OK"
                    ? "#FCA5A5"
                    : aiResultados[tipoDocumento]?.tipo === "OK"
                    ? "#BBF7D0"
                    : archivosCargados[tipoDocumento] ? "#BBF7D0" : "#E5E7EB",
                  transition: "background-color 0.4s, border-color 0.4s",
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
                    disabled={archivosCargados[tipoDocumento] || (archivosExistentes[tipoDocumento]?.length > 0 && !archivosCargados[tipoDocumento])}
                    sx={{ minWidth: 180, borderStyle: "dashed" }}
                  >
                    {tipoDocumento}
                  </Button>
                </label>

                <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  {archivosExistentes[tipoDocumento]?.length > 0 && !archivosCargados[tipoDocumento] ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={archivosExistentes[tipoDocumento][0].NombreArchivo}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ maxWidth: "100%", fontWeight: 600 }}
                    />
                  ) : archivosCargadosInfo[tipoDocumento] ? (
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

                  {/* Estado de la revisión IA (se actualiza solo: la IA revisa en segundo plano) */}
                  {aiResultados[tipoDocumento] != null && (() => {
                    const r = aiResultados[tipoDocumento]!;
                    if (r.tipo === "REVISANDO") {
                      return (
                        <Chip
                          icon={<CircularProgress size={12} sx={{ color: "#6B7280", ml: "6px !important" }} />}
                          label="IA: revisando…"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: 11, bgcolor: "#F3F4F6", color: "#4B5563" }}
                        />
                      );
                    }
                    const ok = r.tipo === "OK";
                    return (
                      <>
                        <Tooltip title={r.descripcion} arrow>
                          <Chip
                            icon={ok
                              ? <SmartToyIcon sx={{ fontSize: "14px !important" }} />
                              : <WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
                            label={`IA: ${r.tipo}`}
                            size="small"
                            color={ok ? "success" : "error"}
                            variant="filled"
                            sx={{ fontWeight: 700, fontSize: 11, flexShrink: 0 }}
                          />
                        </Tooltip>
                        {!ok && (
                          <Tooltip title={r.descripcion} arrow>
                            <Typography noWrap sx={{ fontSize: 12, color: "#B91C1C", minWidth: 0 }}>
                              {r.descripcion}
                            </Typography>
                          </Tooltip>
                        )}
                      </>
                    );
                  })()}
                </Box>

                {archivosExistentes[tipoDocumento]?.length > 0 && !archivosCargados[tipoDocumento] ? (
                  <Tooltip title="Reemplazar archivo" arrow>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleReemplazar(tipoDocumento)}
                      sx={{ bgcolor: "#FFFBEB", "&:hover": { bgcolor: "#FEF3C7" } }}
                    >
                      <SyncIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <>
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
                  </>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Bandejas de trabajo (pestañas) ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <CardHeader icon={<ListAltIcon />} label="Mis bandejas" />
        <Box sx={{ borderBottom: "1px solid #E5E7EB", px: 1 }}>
          <Tabs value={bandeja} onChange={(_, v) => setBandeja(v)} variant="scrollable" scrollButtons="auto"
            sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 52 }, "& .Mui-selected": { color: "#381A73 !important" },
                  "& .MuiTabs-indicator": { backgroundColor: "#381A73", height: 3 } }}>
            <Tab icon={<ListAltIcon fontSize="small" />} iconPosition="start"
              label={<EtiquetaBandeja texto="Admisiones pendientes" cantidad={admision_pendientes_facturacion?.length ?? 0} color="primary" />} />
            <Tab icon={<SmartToyIcon fontSize="small" />} iconPosition="start"
              label={<EtiquetaBandeja texto="Hallazgos IA por corregir" cantidad={pendientesIA} color="error" />} />
            <Tab icon={<CommentIcon fontSize="small" />} iconPosition="start"
              label={<EtiquetaBandeja texto="Observaciones sin archivos" cantidad={observaciones.length} color="warning" />} />
            <Tab icon={<BadgeIcon fontSize="small" />} iconPosition="start" label="Consultar archivos guardados" />
          </Tabs>
        </Box>

        {/* Las pestañas se mantienen montadas (solo se ocultan) para que los contadores carguen al abrir la pantalla */}
        <Box sx={{ display: bandeja === 0 ? "block" : "none" }}>
            <TablaFacturacionPendientes
              userId={isLider ? selectedUserId : undefined}
              isLider={isLider}
              users={users}
              selectedUserId={selectedUserId}
              onUserChange={(id) => { setSelectedUserId(id); setObservaciones([]); }}
            />
        </Box>
        <Box sx={{ display: bandeja === 1 ? "block" : "none", p: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 1.5 }}>
              Haga clic en el número de admisión para abrirla y reemplace el documento con el correcto: la IA lo revisará de nuevo y, si está bien, quedará como corregido.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 2 }}>
              <TextField label="Desde" type="date" size="small" value={filtroIA.desde}
                onChange={(e) => setFiltroIA(f => ({ ...f, desde: e.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Hasta" type="date" size="small" value={filtroIA.hasta}
                onChange={(e) => setFiltroIA(f => ({ ...f, hasta: e.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField select label="Estado" size="small" value={filtroIA.estado} sx={{ minWidth: 150 }}
                onChange={(e) => setFiltroIA(f => ({ ...f, estado: e.target.value }))} SelectProps={{ native: true }}>
                <option value="pendiente">Pendientes</option>
                <option value="resuelto">Corregidos</option>
                <option value="todos">Todos</option>
              </TextField>
              <Button variant="contained" onClick={cargarHallazgosIA} startIcon={<SearchIcon />}
                sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}>
                Consultar
              </Button>
            </Box>
            <DataGrid
              sx={{ ...HEADER_SX, "& .MuiDataGrid-cell": { alignItems: "flex-start", py: 1 } }}
              rows={hallazgosIA}
              columns={columnsHallazgosIA}
              getRowId={(row) => row.IdRevision}
              getRowHeight={() => "auto"}
              loading={hallazgosIALoading}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              localeText={{ noRowsLabel: "No hay documentos con hallazgos para estos filtros" }}
              slots={{ toolbar: GridToolbarExport }}
              disableRowSelectionOnClick
            />
        </Box>
        <Box sx={{ display: bandeja === 2 ? "block" : "none", p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleFetchObservaciones()}
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
        </Box>
        <Box sx={{ display: bandeja === 3 ? "block" : "none", p: 2 }}>
          <PrimeReactProvider>
            <AdmsionFacturacion />
          </PrimeReactProvider>
        </Box>
      </Card>

    </Box>
  );
};
