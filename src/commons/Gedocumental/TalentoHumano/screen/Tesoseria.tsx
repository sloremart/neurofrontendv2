import React, { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button, FormControl, MenuItem, Select } from "@mui/material";
import Divider from "@mui/material/Divider";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CONFIG from "../../../../config/api.js";
import { Title } from "../../../../components/Title.tsx";
import GuardarButton from "../../../../components/BotonGuardar.tsx";
import { Hallazgo, IObjAdmision, Observacion } from "../interfaces/TalentoHumano.ts";
import { toast } from "react-toastify";
import SearchIcon from "@mui/icons-material/Search";
import { control_error } from "../../../../components/Notificacion.tsx";
import {
  consultarArchivos,
  get_hallazgos,
} from "../store/thunks/TalentoHumanoThunks.tsx";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import { IAdmisiones } from "../../../interfaces/GeDocumental.ts";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store.ts";
import { useNavigate } from "react-router-dom";
import { TablaPendientesTesoreria } from "../../Facturacion/components/TablaPendientesTesoreria.tsx";
const API_ENDPOINT = CONFIG.API_ENDPOINT;

export const Tesoreria = () => {
  const [archivosPDF, setArchivosPDF] = useState<IObjAdmision[]>([]);
  const [mostrarBotonObservacion, setMostrarBotonObservacion] = useState(false);
  const [consecutivoConsulta, setConsecutivoConsulta] = useState("");
  const [admisionData, setAdmisionData] = useState<IAdmisiones | null>(null);
  const [selectedHallazgo, setSelectedHallazgo] = useState<number | null>(null);
  const { hallazgo } = useSelector((state: RootState) => state.talento_humano);
  const [observacionAdicional, setObservacionAdicional] = useState<string>("");
  const dispatch = useDispatch();
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(get_hallazgos());
  }, [dispatch]);

  const handleConsecutivoChangeConsulta = (event) => {
    setConsecutivoConsulta(event.target.value);
    setArchivosPDF((prevArchivosPDF) =>
      prevArchivosPDF.map((item) => ({ ...item, EditorVisible: false }))
    );
  };

  const handleAgregarObservacionClick = (index) => {
    setArchivosPDF((prevArchivosPDF) => {
      const newArchivosPDF = prevArchivosPDF.map((archivo, i) => {
        if (i === index) {
          return {
            ...archivo,
            EditorVisible: true,
            Observacion: "",
          };
        }
        return archivo;
      });
      return newArchivosPDF;
    });
  };
  const handleRedirigir = () => {
    navigate("/gestion_programacion_pagos");
  };
  const handleConsultaArchivos = async () => {
    await consultarArchivos(
      consecutivoConsulta,
      setArchivosPDF,
      setMostrarBotonObservacion,
      setObservaciones
    );
    handleFetchData();
  };

  const DescargarArchivo = (idArchivo) => {
    const url = `${API_ENDPOINT}/descargar/${idArchivo}/`;
    window.open(url, "_blank");
  };

  const enviarDataAlBackend = async () => {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) {
      console.error(
        "Datos del usuario no encontrados en el almacenamiento local."
      );
      return;
    }
    const userData = JSON.parse(userDataString);

    const dataToSend = {
      consecutivoConsulta,
      UsuariosTesoreria: userData.id,
      archivos: archivosPDF.map((item) => ({
        IdArchivo: item.IdArchivo,
        NombreArchivo: item.NombreArchivo,
        RutaArchivo: item.RutaArchivo,
        Observacion: item.Observacion,
        RevisionPrimera: item.RevisionPrimera || false,
        RevisionSegunda: item.RevisionSegunda || false,
        RevisionTercera: item.RevisionTercera || false,
      })),
    };

    if (dataToSend.archivos.length === 0) {
      toast.warn("No se han enviado archivos", { autoClose: 3000 });
      return;
    }
    try {
      const response = await fetch(
        `${API_ENDPOINT}/admision_revision_tesoreria/${consecutivoConsulta}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);

      // Mostrar notificación de éxito
      toast.success(responseData.message, { autoClose: 3000 });
    } catch (error) {
      console.error("Error al enviar datos al backend:", error.message);

      // Mostrar notificación de error utilizando control_error
      control_error("Error al enviar datos al backend");
    }
  };
  const handleFetchData = () => {
    fetchData();
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/admisiones/${consecutivoConsulta}/`
      );
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const responseData = await response.json();
      setAdmisionData(responseData.data);
      toast.success("Datos de admisión obtenidos correctamente", {
        autoClose: 3000,
      });
    } catch (error) {
      console.error(
        "Error al obtener la información de la admisión:",
        error.message
      );
      toast.error("Error al obtener la información de la admisión", {
        autoClose: 3000,
      });
    }
  };
  const handleGuardarObservacion = (index: number) => {
    setArchivosPDF((prevArchivosPDF) => {
      const newArchivosPDF = [...prevArchivosPDF];
      const updatedArchivo = { ...newArchivosPDF[index] };

      const hallazgoSeleccionado = hallazgo.find(
        (h) => h.id === selectedHallazgo
      );
      if (hallazgoSeleccionado) {
        updatedArchivo.Observacion = hallazgoSeleccionado.descripcion;
        if (selectedHallazgo === 24) {
          updatedArchivo.Observacion += `: ${observacionAdicional}`;
        }
      }

      newArchivosPDF[index] = updatedArchivo;
      return newArchivosPDF;
    });
    setSelectedHallazgo(null);
    setObservacionAdicional("");
  };

  return (
    <>


      <div className="myContainer">
        <Title title="INFORMACIÓN DE LA ADMISIÓN" />

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
            Número de admisión
          </span>
          <span className="p-float-label">
            <InputText
              id="in"
              value={consecutivoConsulta}
              onChange={handleConsecutivoChangeConsulta}
            />
            <label htmlFor="in">Consecutivo</label>
          </span>
          <Button
            startIcon={<SearchIcon />}
            onClick={handleConsultaArchivos}
            variant="contained"
            style={{
              width: "30px",
              height: "38px",
              marginTop: "2px",
              marginLeft: "20px",
            }}></Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleRedirigir}
            style={{
           
              height: "38px",
              marginTop: "2px",
              marginLeft: "20px",
            }}>
            Ir a Programación de Pagos
          </Button>
        </div>

        {admisionData ? (
          <div
            className="input-container"
            style={{
              display: "flex",
              marginLeft: "60px",
              marginTop: "80px",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "25px",
            }}>
            <span className="p-float-label">
              <InputText
                id="facturanoInput"
                value={`${admisionData.Prefijo || ""}${admisionData.FacturaNo}`}
                readOnly
                style={{
                  fontSize: "16px",
                  width: "300px",
                  marginRight: "20px",
                }}
              />
              <label
                htmlFor="facturanoInput"
                style={{
                  width: "300px",
                  marginRight: "20px",
                }}>
                Factura No
              </label>
            </span>

            <span className="p-float-label">
              <InputText
                id="codigoentidadInput"
                value={admisionData.CodigoEntidad}
                readOnly
              />
              <label htmlFor="codigoentidadInput">Código Entidad</label>
            </span>
            <span className="p-float-label">
              <InputText
                id="nombrecompletoInput"
                value={admisionData.NombreResponsable}
                readOnly
                style={{
                  fontSize: "16px",
                  width: "400px",
                  marginLeft: "20px",
                }}
              />
              <label
                htmlFor="nombrecompletoInput"
                style={{
                  width: "450px",
                  marginLeft: "20px",
                }}>
                Nombre Completo
              </label>
            </span>
            <span className="p-float-label">
              <InputText
                id="nombrecompletoInput"
                value={admisionData.IdPaciente}
                readOnly
                style={{
                  fontSize: "16px",
                  width: "300px",
                  marginLeft: "20px",
                }}
              />
              <label
                htmlFor="nombrecompletoInput"
                style={{
                  width: "450px",
                  marginLeft: "20px",
                }}>
                Número de identificación
              </label>
            </span>
          </div>
        ) : (
          <p>{consecutivoConsulta ? "" : ""}</p>
        )}
      </div>
      <div className="Container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
          }}>
          <label style={{ color: "grey", fontWeight: "bold" }}>
            DOCUMENTOS ADJUNTADOS
          </label>
        </div>
      </div>
      <div
        className="myContainer"
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "20px",
        }}>
        <div className="pdf-buttons-container" style={{ marginLeft: "20px" }}>
          {archivosPDF.map((item, index) => (
            <div key={item.IdArchivo}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "10px",
                }}>
                <Button
                  startIcon={<UploadFileIcon />}
                  variant="outlined"
                  color="primary"
                  style={{
                    width: "200px",
                    height: "38px",
                    minWidth: "300px",
                  }}
                  onClick={() => DescargarArchivo(item.IdArchivo)}>
                  {item.NombreArchivo || ""}
                </Button>
                {mostrarBotonObservacion && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        width: "150px",
                        height: "38px",
                        marginLeft: "10px",
                      }}
                      onClick={() => handleAgregarObservacionClick(index)}>
                      Observación
                    </Button>

                    {item.EditorVisible && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginLeft: "20px",
                        }}>
                        <FormControl
                          style={{
                            marginRight: "20px",
                          }}>
                          <Select
                            style={{
                              marginRight: "20px",
                              width: "500px",
                              height: "40px",
                            }}
                            labelId={`hallazgo-select-label-${index}`}
                            value={selectedHallazgo || ""}
                            onChange={(e) =>
                              setSelectedHallazgo(e.target.value as number)
                            }>
                            {hallazgo.map((hallazgo: Hallazgo) => (
                              <MenuItem key={hallazgo.id} value={hallazgo.id}>
                                {hallazgo.descripcion}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button
                          startIcon={<FileDownloadDoneIcon />}
                          variant="contained"
                          style={{
                            width: "50px",
                            height: "38px",
                          }}
                          onClick={() =>
                            handleGuardarObservacion(index)
                          }></Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedHallazgo === 24 && (
                <FormControl
                  style={{
                    marginRight: "20px",
                    width: "1000px",
                    marginTop: "20px",
                  }}>
                  <InputText
                    type="text"
                    value={observacionAdicional}
                    onChange={(e) => setObservacionAdicional(e.target.value)}
                    placeholder="Ingrese la observación"
                    style={{
                      marginBottom: "20px",
                      width: "1000px",
                      marginTop: "20px",
                    }}
                  />
                </FormControl>
              )}

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

                            newObservaciones[idx].Descripcion = e.target.value;
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

              <Divider
                style={{
                  marginTop: "30px",
                  marginBottom: "20px",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
              />
            </div>
          ))}
          {archivosPDF.length > 0 && (
            <div
              className="container"
              style={{
                display: "flex",
                marginLeft: "100px",
                marginTop: "10px",
                marginBottom: "30px",
                justifyContent: "center",
              }}>
              <GuardarButton onClick={enviarDataAlBackend} />
            </div>
          )}
        </div>
      </div>
      <TablaPendientesTesoreria />
    </>
  );
};
