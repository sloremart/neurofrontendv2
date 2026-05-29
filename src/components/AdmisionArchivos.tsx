import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import CONFIG from "../config/api";
import { IObjAdmision } from "../commons/Gedocumental/TalentoHumano/interfaces/TalentoHumano";

import { consultarArchivos } from "../commons/Gedocumental/TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

export const AdmsionFacturacion = () => {
  const [archivosPDF, setArchivosPDF] = useState<IObjAdmision[]>([]);
  const [mostrarBotonObservacion, setMostrarBotonObservacion] = useState(false);
  const [consecutivoConsulta, setConsecutivoConsulta] = useState("");
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>(
    []
  );
  const handleConsecutivoChangeConsulta = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setConsecutivoConsulta(value);
    setArchivosPDF((prevArchivosPDF) =>
      prevArchivosPDF.map((item) => ({
        ...item,
        EditorVisible: false,
      }))
    );
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const archivo = event.target.files && event.target.files[0];
    if (archivo) {
      setArchivosSeleccionados((prevArchivosSeleccionados) => {
        const nuevosArchivos = [...prevArchivosSeleccionados];
        nuevosArchivos[index] = archivo;
        return nuevosArchivos;
      });

      // Actualizar el nombre del archivo cargado en archivosPDF
      setArchivosPDF((prevArchivosPDF) =>
        prevArchivosPDF.map((item, i) =>
          i === index
            ? {
                ...item,
                nombreArchivoCargado: archivo.name,
              }
            : item
        )
      );
    }
  };

  const handleConsultaArchivos = async () => {
    await consultarArchivos(
      consecutivoConsulta,
      setArchivosPDF,
      setMostrarBotonObservacion
    );
  };

  const handleGuardarArchivo = async (
    consecutivo: string,
    archivo_id: number,
    archivoSeleccionado: File
  ) => {
    try {
      if (!archivoSeleccionado) {
        toast.error("Debe seleccionar un archivo.");
        return;
      }

      const formData = new FormData();
      formData.append("archivo", archivoSeleccionado);
      formData.append("consecutivo", consecutivo);

      const response = await fetch(
        `${API_ENDPOINT}/gedocumental/archivos/${consecutivo}/editar/${archivo_id}/`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Archivo guardado exitosamente");
      } else {
        const data = await response.json();
        toast.error(data.detail);
      }
    } catch (error) {
      console.error("Error al guardar el archivo:", error);
      toast.error("Error desconocido al guardar el archivo");
    }
  };

  const DescargarArchivo = (idArchivo) => {
    const url = `${API_ENDPOINT}/gedocumental/descargar/${idArchivo}/`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div className="myContainer">
        <div
          className="input-container"
          style={{
            display: "flex",
            marginLeft: "50px",
            marginTop: "60px",
            justifyContent: "center",
          }}>
          <span
            style={{
              display: "flex",
              marginRight: "20px",
              marginTop: "10px",
              justifyContent: "center",
            }}>
            {" "}
            Número de admisión
          </span>
          <span className="p-float-label">
            <InputText
              id="in"
              value={consecutivoConsulta}
              onChange={handleConsecutivoChangeConsulta}
            />
            <label htmlFor="in">Estudio</label>
          </span>
          <Button
            onClick={handleConsultaArchivos}
            variant="contained"
            style={{
              width: "300px",
              height: "38px",
              marginTop: "2px",
              marginLeft: "20px",
            }}>
            Buscar Archivos de Admisión
          </Button>
        </div>

        <div
          className="container"
          style={{ display: "flex", marginLeft: "50px", marginTop: "60px" }}>
          <div className="pdf-buttons-container" style={{ marginLeft: "20px" }}>
            {archivosPDF.map((item, index) => (
              <div key={item.IdArchivo}>
                <Button
                  startIcon={<UploadFileIcon />}
                  variant="outlined"
                  color="primary"
                  style={{
                    width: "200px",
                    height: "38px",
                    marginTop: "10px",
                    minWidth: "300px",
                    marginRight: "20px",
                  }}
                  onClick={() => DescargarArchivo(item.IdArchivo)}>
                  {item.NombreArchivo || ""}
                </Button>

                <label htmlFor={`file-upload-${item.IdArchivo}`}>
                  <Button
                    style={{
                      width: "220px",
                      height: "38px",
                      marginTop: "10px",
                      minWidth: "150px",
                    }}
                    variant="outlined"
                    color="primary"
                    component="span"
                    disabled={
                      !item.Observaciones || item.Observaciones.length === 0
                    }>
                    {item.nombreArchivoCargado
                      ? item.nombreArchivoCargado
                      : "Cargar Archivo"}
                  </Button>
                  <input
                    id={`file-upload-${item.IdArchivo}`}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileInputChange(e, index)}
                  />
                </label>
                <Button
                  startIcon={<SaveIcon />}
                  style={{
                    width: "220px",
                    height: "38px",
                    marginTop: "10px",
                    marginLeft: "10px",
                    minWidth: "150px",
                  }}
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (
                      item.IdArchivo !== undefined &&
                      archivosSeleccionados[index]
                    ) {
                      handleGuardarArchivo(
                        consecutivoConsulta,
                        item.IdArchivo,
                        archivosSeleccionados[index]
                      );
                    } else {
                      console.error(
                        "IdArchivo es undefined o archivo no seleccionado"
                      );
                    }
                  }}>
                  Guardar Cambios
                </Button>

                {item.Observaciones && item.Observaciones.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h4>Observaciones :</h4>
                    {item.Observaciones.map((observacion, idx) => (
                      <div key={observacion.IdObservacion}>
                        <InputText
                          value={observacion.Descripcion || ""}
                          onChange={(e) => {
                            if (
                              item.Observaciones &&
                              Array.isArray(item.Observaciones)
                            ) {
                              const newObservaciones = [...item.Observaciones];

                              newObservaciones[idx].Descripcion =
                                e.target.value;
                              setArchivosPDF((prevArchivosPDF) =>
                                prevArchivosPDF.map((archivo, i) =>
                                  i === index
                                    ? {
                                        ...archivo,
                                        Observaciones: newObservaciones,
                                      }
                                    : archivo
                                )
                              );
                            }
                          }}
                          disabled
                          style={{
                            marginBottom: "20px",
                            width: "1000px",
                            marginTop: "20px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className="input-container"
                  style={{
                    display: "flex",
                    marginLeft: "100px",
                    marginTop: "60px",
                    justifyContent: "center",
                  }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
