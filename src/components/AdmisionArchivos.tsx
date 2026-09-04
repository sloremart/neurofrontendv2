import React, { useState } from "react";
import {
  Box, TextField, Button, Typography, Chip,
  IconButton, Tooltip, Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import CONFIG from "../config/api";
import { IObjAdmision } from "../commons/Gedocumental/TalentoHumano/interfaces/TalentoHumano";
import { consultarArchivos } from "../commons/Gedocumental/TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

const formatearFecha = (val: string) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
  } catch { return val; }
};

export const AdmsionFacturacion = () => {
  const [archivosPDF, setArchivosPDF] = useState<IObjAdmision[]>([]);
  const [consecutivoConsulta, setConsecutivoConsulta] = useState("");
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);

  const handleConsultaArchivos = async () => {
    if (!consecutivoConsulta.trim()) return;
    await consultarArchivos(consecutivoConsulta, setArchivosPDF, () => {}, () => {});
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setArchivosSeleccionados(prev => { const next = [...prev]; next[index] = archivo; return next; });
    setArchivosPDF(prev => prev.map((item, i) => i === index ? { ...item, nombreArchivoCargado: archivo.name } : item));
  };

  const handleGuardarArchivo = async (consecutivo: string, archivo_id: number, archivoSeleccionado: File) => {
    if (!archivoSeleccionado) { toast.error("Debe seleccionar un archivo."); return; }
    const formData = new FormData();
    formData.append("archivo", archivoSeleccionado);
    formData.append("consecutivo", consecutivo);
    try {
      const response = await fetch(
        `${API_ENDPOINT}/gedocumental/archivos/${consecutivo}/editar/${archivo_id}/`,
        { method: "PUT", body: formData }
      );
      if (response.ok) toast.success("Archivo guardado exitosamente");
      else { const d = await response.json(); toast.error(d.detail); }
    } catch {
      toast.error("Error al guardar el archivo");
    }
  };

  const descargarArchivo = (idArchivo: number) => {
    window.open(`${API_ENDPOINT}/gedocumental/descargar/${idArchivo}/`, "_blank");
  };

  return (
    <Box>
      {/* Buscador */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
        <TextField
          label="Núm. estudio / admisión"
          value={consecutivoConsulta}
          onChange={e => setConsecutivoConsulta(e.target.value)}
          size="small"
          sx={{ width: 220 }}
          onKeyDown={e => e.key === "Enter" && handleConsultaArchivos()}
        />
        <Button
          variant="contained"
          onClick={handleConsultaArchivos}
          startIcon={<SearchIcon />}
          sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
        >
          Buscar archivos
        </Button>
      </Box>

      {/* Lista de archivos */}
      {archivosPDF.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#9CA3AF", textAlign: "center", py: 2 }}>
          Ingresa un número de admisión y presiona Buscar.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {archivosPDF.map((item, index) => (
            <Box
              key={item.IdArchivo}
              sx={{
                p: 1.5, borderRadius: 1.5,
                border: "1px solid",
                borderColor: item.Observaciones && item.Observaciones.length > 0 ? "#FCA5A5" : "#E5E7EB",
                bgcolor: item.Observaciones && item.Observaciones.length > 0 ? "#FFF5F5" : "#FAFAFA",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {/* Nombre y fecha */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600, fontSize: 13, color: "#1E2E71" }}>
                    {item.NombreArchivo || "Sin nombre"}
                  </Typography>
                  {(item as any).FechaCreacionArchivo && (
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                      {formatearFecha((item as any).FechaCreacionArchivo)}
                    </Typography>
                  )}
                </Box>

                {/* Ver */}
                <Tooltip title="Ver documento" arrow>
                  <IconButton
                    size="small"
                    onClick={() => descargarArchivo(item.IdArchivo!)}
                    sx={{ color: "#381A73", bgcolor: "#EEF2FF", "&:hover": { bgcolor: "#E0E7FF" } }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Cargar nuevo (solo si tiene observaciones) */}
                {item.Observaciones && item.Observaciones.length > 0 && (
                  <>
                    <label htmlFor={`file-upload-${item.IdArchivo}`}>
                      <Button
                        variant="outlined"
                        component="span"
                        size="small"
                        startIcon={<UploadFileIcon />}
                        sx={{ borderStyle: "dashed", fontSize: 12 }}
                      >
                        {archivosSeleccionados[index]?.name || "Reemplazar"}
                      </Button>
                      <input
                        id={`file-upload-${item.IdArchivo}`}
                        type="file"
                        style={{ display: "none" }}
                        onChange={e => handleFileInputChange(e, index)}
                      />
                    </label>

                    <Tooltip title="Guardar cambio" arrow>
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={!archivosSeleccionados[index]}
                          onClick={() => {
                            if (item.IdArchivo != null && archivosSeleccionados[index]) {
                              handleGuardarArchivo(consecutivoConsulta, item.IdArchivo, archivosSeleccionados[index]);
                            }
                          }}
                          sx={{ bgcolor: "#EEF2FF", "&:hover": { bgcolor: "#E0E7FF" } }}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </Box>

              {/* Observaciones */}
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
                      sx={{ mr: 0.5, mb: 0.5, maxWidth: "100%", height: "auto",
                        "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
