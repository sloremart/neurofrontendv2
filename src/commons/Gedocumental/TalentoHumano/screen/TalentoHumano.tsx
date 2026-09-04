import React, { useEffect, useState } from "react";
import {
  Button, Checkbox, FormControl, InputLabel, MenuItem, Select,
  TextField, Box, Card, CardContent, Typography, Chip, Divider,
  Tooltip, IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import CommentIcon from "@mui/icons-material/Comment";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CONFIG from "../../../../config/api.js";
import { Title } from "../../../../components/Title.tsx";
import { Hallazgo, IObjAdmision, Observacion } from "../interfaces/TalentoHumano.ts";
import { toast } from "react-toastify";
import { control_error } from "../../../../components/Notificacion.tsx";
import {
  actualizarRegimenArchivos, consultarArchivos,
  eliminarArchivoFacturacion, enviar_tesoreria, get_hallazgos,
} from "../store/thunks/TalentoHumanoThunks.tsx";
import { IAdmisiones } from "../../../interfaces/GeDocumental.ts";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store/store.ts";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const HEADER_SX_CARD = {
  px: 2.5, py: 1.5,
  background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
  display: "flex", alignItems: "center", gap: 1,
  borderRadius: "8px 8px 0 0",
};

const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <Box sx={HEADER_SX_CARD}>
    <Box sx={{ color: "rgba(255,255,255,0.8)", display: "flex", fontSize: 18 }}>{icon}</Box>
    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

export const TalentoHumano = () => {
  const [archivosPDF, setArchivosPDF] = useState<IObjAdmision[]>([]);
  const [mostrarBotonObservacion, setMostrarBotonObservacion] = useState(false);
  const [consecutivoConsulta, setConsecutivoConsulta] = useState("");
  const [admisionData, setAdmisionData] = useState<IAdmisiones | null>(null);
  const [userSeleccionado, setUserSeleccionado] = useState<number | null>(null);
  const [userSeleccionadoT, setUserSeleccionadoT] = useState<number | null>(null);
  const [selectedHallazgoSinArchivo, setSelectedHallazgoSinArchivo] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [regimen, setRegimen] = useState("");
  const [botonContributivoDisabled, setBotonContributivoDisabled] = useState(false);
  const [botonSubsidiadoDisabled, setBotonSubsidiadoDisabled] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { hallazgo } = useSelector((state: RootState) => state.talento_humano);
  const { users } = useSelector((state: RootState) => state.users);

  useEffect(() => {
    dispatch(get_users());
    dispatch(get_hallazgos());
    const ud = localStorage.getItem("userData");
    if (ud) setUserId(JSON.parse(ud).id);
  }, [dispatch]);

  const determinarRegimenMayor = (archivos: IObjAdmision[]) => {
    const regimenCount = archivos.reduce((acc: Record<string, number>, a: IObjAdmision) => {
      if (a.Regimen) acc[a.Regimen] = (acc[a.Regimen] || 0) + 1;
      return acc;
    }, {});
    if (Object.keys(regimenCount).length === 0 || (regimenCount[""] && regimenCount[""] > 0)) {
      setBotonContributivoDisabled(false); setBotonSubsidiadoDisabled(false);
    } else if ((regimenCount["C"] || 0) >= (regimenCount["S"] || 0)) {
      setBotonContributivoDisabled(false); setBotonSubsidiadoDisabled(true);
    } else {
      setBotonContributivoDisabled(true); setBotonSubsidiadoDisabled(false);
    }
  };

  const handleConsultaArchivos = async () => {
    const archivos = await consultarArchivos(
      consecutivoConsulta, setArchivosPDF, setMostrarBotonObservacion, setObservaciones
    );
    if (archivos) determinarRegimenMayor(archivos);
    fetchAdmisionData();
  };

  const fetchAdmisionData = async () => {
    try {
      const res = await fetch(`${API_ENDPOINT}/gedocumental/admisiones/${consecutivoConsulta}/`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const { data } = await res.json();
      setAdmisionData(data);
      if (data.ContratoRegimen === 1) setRegimen("C");
      else if (data.ContratoRegimen === 2) setRegimen("S");
      else {
        const alias = (data.ContratoAlias || "").toUpperCase();
        if (alias.includes("CONTRIBUTIVO")) setRegimen("C");
        else if (alias.includes("SUBSIDIADO")) setRegimen("S");
      }
    } catch {
      toast.error("Error al obtener la información de la admisión", { autoClose: 3000 });
    }
  };

  const handleRegimenChange = async (nuevoRegimen: string) => {
    try {
      await actualizarRegimenArchivos(consecutivoConsulta, nuevoRegimen);
      const archivos = await consultarArchivos(
        consecutivoConsulta, setArchivosPDF, setMostrarBotonObservacion, setObservaciones
      );
      if (archivos) determinarRegimenMayor(archivos);
    } catch { /* errors handled by thunk */ }
  };

  const handleAgregarObservacionClick = (index: number) => {
    setArchivosPDF(prev => prev.map((a, i) =>
      i === index ? { ...a, EditorVisible: true, Observacion: "", selectedHallazgo: null } : a
    ));
  };

  const handleHallazgoChange = (index: number, hallazgoId: number) => {
    setArchivosPDF(prev => prev.map((a, i) => i === index ? { ...a, selectedHallazgo: hallazgoId } : a));
  };

  const handleGuardarObservacion = (index: number) => {
    setArchivosPDF(prev => {
      const next = [...prev];
      const h = hallazgo.find(h => h.id === next[index].selectedHallazgo);
      if (h) next[index] = { ...next[index], Observacion: h.descripcion };
      return next;
    });
  };

  const enviarDataAlBackend = async () => {
    const ud = localStorage.getItem("userData");
    if (!ud) return;
    const userData = JSON.parse(ud);
    const dataToSend = {
      consecutivoConsulta,
      UsuarioCuentasMedicas: userData.id,
      archivos: archivosPDF.map(item => ({
        IdArchivo: item.IdArchivo,
        NombreArchivo: item.NombreArchivo,
        RutaArchivo: item.RutaArchivo,
        Observacion: item.Observacion,
        RevisionPrimera: item.RevisionPrimera || false,
        RevisionSegunda: item.RevisionSegunda || false,
        RevisionTercera: item.RevisionTercera || false,
      })),
    };
    if (dataToSend.archivos.length === 0) { toast.warn("No se han enviado archivos", { autoClose: 3000 }); return; }
    try {
      const res = await fetch(`${API_ENDPOINT}/gedocumental/admision-revision/${consecutivoConsulta}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message, { autoClose: 3000 });
    } catch {
      control_error("Error al enviar datos al backend");
    }
  };

  const handleEliminarArchivo = async (archivoId: number) => {
    try {
      const res = await eliminarArchivoFacturacion(archivoId);
      if (!res || !res.ok) throw new Error();
      await handleConsultaArchivos();
    } catch { /* errors shown by eliminarArchivoFacturacion */ }
  };

  const handleActualizarRevisor = async () => {
    if (!consecutivoConsulta || !userSeleccionadoT) {
      toast.warn("Debe seleccionar un usuario y una admisión", { autoClose: 3000 }); return;
    }
    try {
      await dispatch(enviar_tesoreria(consecutivoConsulta, userSeleccionadoT));
      toast.success("Revisor actualizado correctamente", { autoClose: 3000 });
    } catch {
      toast.error("Error al actualizar revisor", { autoClose: 3000 });
    }
  };

  const agregarObservacionSinArchivo = async () => {
    if (!userSeleccionado || !selectedHallazgoSinArchivo || !consecutivoConsulta) {
      toast.warn("Por favor complete todos los campos", { autoClose: 3000 }); return;
    }
    const hallazgoSeleccionado = hallazgo.find(h => h.id === selectedHallazgoSinArchivo);
    const descripcion = hallazgoSeleccionado?.descripcion;
    if (!descripcion) { toast.warn("Seleccione una observación válida", { autoClose: 3000 }); return; }
    try {
      const res = await fetch(`${API_ENDPOINT}/agregar_observacion_sin_archivo/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ AdmisionId: consecutivoConsulta, Usuario: userSeleccionado, Descripcion: descripcion, TipoArchivo: "Sin Archivo" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message, { autoClose: 3000 });
      setUserSeleccionado(null);
      setSelectedHallazgoSinArchivo(null);
    } catch {
      toast.error("Error al agregar observación sin archivo", { autoClose: 3000 });
    }
  };

  const canDelete = userId === 182 || userId === 199 || userId === 209 || userId === 214;

  return (
    <Box sx={{ p: 2 }}>
      <Title title={'MÓDULO DE GESTIÓN - CUENTAS MÉDICAS'} />

      {/* ── Buscar admisión ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader icon={<SearchIcon />} label="Buscar admisión" />
        <CardContent sx={{ pb: "16px !important" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <TextField
              label="Número de estudio / admisión"
              value={consecutivoConsulta}
              onChange={e => setConsecutivoConsulta(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleConsultaArchivos()}
              size="small"
              sx={{ width: 260 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleConsultaArchivos}
              sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
            >
              Buscar
            </Button>

            <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Régimen:</Typography>
              <Button
                variant={regimen === "C" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleRegimenChange("C")}
                disabled={botonContributivoDisabled && regimen !== ""}
                sx={regimen === "C" ? { background: "linear-gradient(90deg, #1E2E71, #0F4374)" } : { borderColor: "#1E2E71", color: "#1E2E71" }}
              >
                Contributivo
              </Button>
              <Button
                variant={regimen === "S" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleRegimenChange("S")}
                disabled={botonSubsidiadoDisabled && regimen !== ""}
                sx={regimen === "S" ? { background: "linear-gradient(90deg, #1E2E71, #0F4374)" } : { borderColor: "#1E2E71", color: "#1E2E71" }}
              >
                Subsidiado
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (botonContributivoDisabled && !botonSubsidiadoDisabled) handleRegimenChange("C");
                  else if (!botonContributivoDisabled && botonSubsidiadoDisabled) handleRegimenChange("S");
                }}
                sx={{ borderColor: "#EF4444", color: "#EF4444" }}
              >
                Cambiar
              </Button>
            </Box>
          </Box>

          {/* Datos del paciente */}
          {admisionData && (
            <Box sx={{ mt: 2.5 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 2 }}>
                <TextField label="Factura No" value={`${admisionData.Prefijo || ""}${admisionData.FacturaNo}`} variant="filled" size="small" InputProps={{ readOnly: true }} />
                <TextField label="Entidad / Contrato" value={(admisionData as any).NombreEntidad || (admisionData as any).ContratoAlias || admisionData.CodigoEntidad || ""} variant="filled" size="small" InputProps={{ readOnly: true }} />
                <TextField label="Nombre completo" value={(admisionData as any).NombreCompleto || admisionData.NombreResponsable || ""} variant="filled" size="small" InputProps={{ readOnly: true }} />
                <TextField label="Número de identificación" value={admisionData.IdPaciente || ""} variant="filled" size="small" InputProps={{ readOnly: true }} />
              </Box>
              <TextField label="Código CUV" value={(admisionData as any).CUV || ""} variant="filled" size="small" fullWidth InputProps={{ readOnly: true }} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Documentos adjuntados ── */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader icon={<FolderOpenIcon />} label="Documentos adjuntados" />
        <CardContent sx={{ pb: "16px !important" }}>
          {archivosPDF.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#9CA3AF", textAlign: "center", py: 2 }}>
              Busca una admisión para ver los documentos adjuntos.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {archivosPDF.map((item, index) => (
                <Box
                  key={item.IdArchivo}
                  sx={{
                    p: 1.5, borderRadius: 1.5, border: "1px solid",
                    borderColor: item.Observaciones && item.Observaciones.length > 0 ? "#FCA5A5" : "#E5E7EB",
                    bgcolor: item.Observaciones && item.Observaciones.length > 0 ? "#FFF5F5" : "#FAFAFA",
                  }}
                >
                  {/* Fila principal */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Button
                      startIcon={<UploadFileIcon />}
                      variant="outlined"
                      size="small"
                      onClick={() => item.IdArchivo !== undefined && window.open(`${API_ENDPOINT}/gedocumental/descargar/${item.IdArchivo}/`, "_blank")}
                      sx={{ borderColor: "#1E2E71", color: "#1E2E71", minWidth: 220 }}
                    >
                      {item.NombreArchivo || "Archivo"}
                    </Button>

                    {mostrarBotonObservacion && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CommentIcon />}
                          onClick={() => handleAgregarObservacionClick(index)}
                          sx={{ borderColor: "#F59E0B", color: "#92400E" }}
                        >
                          Observación
                        </Button>

                        {item.EditorVisible && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                            <FormControl size="small" sx={{ flex: 1, maxWidth: 500 }}>
                              <InputLabel>Hallazgo</InputLabel>
                              <Select
                                value={item.selectedHallazgo || ""}
                                onChange={e => handleHallazgoChange(index, e.target.value as number)}
                                label="Hallazgo"
                              >
                                {hallazgo.map((h: Hallazgo) => (
                                  <MenuItem key={h.id} value={h.id}>{h.descripcion}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Tooltip title="Guardar hallazgo" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleGuardarObservacion(index)}
                                sx={{ bgcolor: "#EEF2FF", color: "#1E2E71", "&:hover": { bgcolor: "#E0E7FF" } }}
                              >
                                <FileDownloadDoneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
                          <Typography sx={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Aprobado</Typography>
                          <Checkbox
                            checked={item.RevisionPrimera || false}
                            onChange={e => setArchivosPDF(prev =>
                              prev.map((a, i) => i === index ? { ...a, RevisionPrimera: e.target.checked } : a)
                            )}
                            size="small"
                            sx={{ color: "#1E2E71", "&.Mui-checked": { color: "#1E2E71" } }}
                          />
                        </Box>
                      </>
                    )}

                    {canDelete && (
                      <Tooltip title="Eliminar archivo" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => item.IdArchivo !== undefined && handleEliminarArchivo(item.IdArchivo)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Observaciones del archivo */}
                  {item.Observaciones && item.Observaciones.length > 0 && (
                    <Box sx={{ mt: 1, pl: 0.5 }}>
                      <Divider sx={{ mb: 1 }} />
                      {item.Observaciones.map((obs: any) => (
                        <Chip
                          key={obs.IdObservacion}
                          label={obs.Descripcion}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5, maxWidth: "100%", height: "auto", "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))}

              {/* Observaciones sin archivo */}
              {observaciones.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1 }}>
                  {observaciones.map((obs, i) => (
                    <TextField
                      key={i}
                      label={`Observación ${i + 1}`}
                      value={obs.Descripcion}
                      size="small"
                      onChange={e => {
                        const next = [...observaciones];
                        next[i].Descripcion = e.target.value;
                        setObservaciones(next);
                      }}
                      sx={{ width: 340 }}
                    />
                  ))}
                </Box>
              )}

              {/* Guardar + Enviar a Tesorería */}
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={enviarDataAlBackend}
                  sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
                >
                  Guardar revisión
                </Button>

                <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Enviar a Tesorería:
                  </Typography>
                  <FormControl size="small" sx={{ width: 200 }}>
                    <InputLabel>Usuario</InputLabel>
                    <Select
                      value={userSeleccionadoT ?? ""}
                      onChange={e => setUserSeleccionadoT(e.target.value as number)}
                      label="Usuario"
                    >
                      {users.map((u, i) => (
                        <MenuItem key={u.id || i} value={u.id}>{u.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleActualizarRevisor}
                    sx={{ background: "linear-gradient(90deg, #1E2E71, #0F4374)" }}
                  >
                    Enviar
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Asignar observación sin archivo ── */}
      <Card variant="outlined" sx={{ borderRadius: 2, border: "1px solid #E5E7EB" }}>
        <SectionHeader icon={<AssignmentIcon />} label="Asignar observación sin archivo" />
        <CardContent sx={{ pb: "16px !important" }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ width: 240 }}>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={userSeleccionado ?? ""}
                onChange={e => setUserSeleccionado(e.target.value as number)}
                label="Usuario"
              >
                {users.map((u, i) => (
                  <MenuItem key={u.id || i} value={u.id}>{u.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1, maxWidth: 480 }}>
              <InputLabel>Observación sin archivo</InputLabel>
              <Select
                value={selectedHallazgoSinArchivo || ""}
                onChange={e => setSelectedHallazgoSinArchivo(e.target.value as number)}
                label="Observación sin archivo"
              >
                {hallazgo.map((h: Hallazgo) => (
                  <MenuItem key={h.id} value={h.id}>{h.descripcion}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<CommentIcon />}
              onClick={agregarObservacionSinArchivo}
              sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
            >
              Agregar observación
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
