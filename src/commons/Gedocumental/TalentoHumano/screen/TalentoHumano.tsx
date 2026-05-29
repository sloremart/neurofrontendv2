import React, { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import {
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import Divider from "@mui/material/Divider";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CONFIG from "../../../../config/api.js";
import { Title } from "../../../../components/Title.tsx";
import SaveIcon from "@mui/icons-material/Save";
import {
  Hallazgo,
  IObjAdmision,
  Observacion,
} from "../interfaces/TalentoHumano.ts";
import { toast } from "react-toastify";
import SearchIcon from "@mui/icons-material/Search";
import { control_error } from "../../../../components/Notificacion.tsx";
import {

  actualizarRegimenArchivos,
  consultarArchivos,
  eliminarArchivoFacturacion,



  enviar_tesoreria,



  get_hallazgos,
} from "../store/thunks/TalentoHumanoThunks.tsx";

import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import { IAdmisiones } from "../../../interfaces/GeDocumental.ts";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store/store.ts";
import { get_users } from "../../../Login/store/thunks/ThunksLogin.tsx";

const API_ENDPOINT = CONFIG.API_ENDPOINT;

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

  const dispatch = useDispatch<AppDispatch>(); // Usa useDispatch al inicio del componente

  const { hallazgo } = useSelector((state: RootState) => state.talento_humano);
  const { users } = useSelector((state: RootState) => state.users);
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(get_users()).unwrap();
      } catch (error) {
        console.error("Error al obtener los códigos:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    dispatch(get_hallazgos());
  }, [dispatch]);

  const handleConsecutivoChangeConsulta = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsecutivoConsulta(event.target.value);
    setArchivosPDF((prevArchivosPDF) =>
      prevArchivosPDF.map((item) => ({ ...item, EditorVisible: false }))
    );
  };

  const handleAgregarObservacionClick = (index: number) => {
    setArchivosPDF((prevArchivosPDF) => {
      const newArchivosPDF = prevArchivosPDF.map((archivo, i) => {
        if (i === index) {
          return {
            ...archivo,
            EditorVisible: true,
            Observacion: "",
            selectedHallazgo: null, // Añadido para manejo de hallazgo por archivo
          };
        }
        return archivo;
      });
      return newArchivosPDF;
    });
  };

  const handleConsultaArchivos = async () => {
    const archivos = await consultarArchivos(
      consecutivoConsulta,
      setArchivosPDF,
      setMostrarBotonObservacion,
      setObservaciones
    );
    if (archivos) {
      determinarRegimenMayor(archivos);
    }
    handleFetchData();
  };

  const determinarRegimenMayor = (archivos: IObjAdmision[]) => {
    const regimenCount = archivos.reduce((acc: Record<string, number>, archivo: IObjAdmision) => {
      if (archivo.Regimen) {
        acc[archivo.Regimen] = (acc[archivo.Regimen] || 0) + 1;
      }
      return acc;
    }, {});

    if (
      Object.keys(regimenCount).length === 0 ||
      (regimenCount[""] && regimenCount[""] > 0)
    ) {
      setBotonContributivoDisabled(false);
      setBotonSubsidiadoDisabled(false);
    } else if ((regimenCount["C"] || 0) >= (regimenCount["S"] || 0)) {
      setBotonContributivoDisabled(false);
      setBotonSubsidiadoDisabled(true);
    } else {
      setBotonContributivoDisabled(true);
      setBotonSubsidiadoDisabled(false);
    }
  };

  const handleRegimenChange = async (nuevoRegimen: string) => {
    try {
      await actualizarRegimenArchivos(consecutivoConsulta, nuevoRegimen);
      const archivosActualizados = await consultarArchivos(
        consecutivoConsulta,
        setArchivosPDF,
        setMostrarBotonObservacion,
        setObservaciones
      );
      if (archivosActualizados) {
        determinarRegimenMayor(archivosActualizados);
      }
    } catch (error) {
      console.error("Error al actualizar régimen:", error);
    }
  };

  const DescargarArchivo = (idArchivo: number) => {
    const url = `${API_ENDPOINT}/gedocumental/descargar/${idArchivo}/`;
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
      UsuarioCuentasMedicas: userData.id,
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
        `${API_ENDPOINT}/gedocumental/admision-revision/${consecutivoConsulta}/`,
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

      toast.success(responseData.message, { autoClose: 3000 });
    } catch (error) {
      console.error("Error al enviar datos al backend:", error instanceof Error ? error.message : error);
      control_error("Error al enviar datos al backend");
    }
  };

  const handleFetchData = () => {
    fetchData();
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/gedocumental/admisiones/${consecutivoConsulta}/`
      );
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const responseData = await response.json();
      const data = responseData.data;
      setAdmisionData(data);
      if (data.ContratoRegimen === 1) {
        setRegimen("C");
      } else if (data.ContratoRegimen === 2) {
        setRegimen("S");
      } else {
        const alias = (data.ContratoAlias || "").toUpperCase();
        if (alias.includes("CONTRIBUTIVO")) setRegimen("C");
        else if (alias.includes("SUBSIDIADO")) setRegimen("S");
      }
      toast.success("Datos de admisión obtenidos correctamente", {
        autoClose: 3000,
      });
    } catch (error) {
      console.error(
        "Error al obtener la información de la admisión:",
        error instanceof Error ? error.message : error
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
        (h) => h.id === updatedArchivo.selectedHallazgo
      );
      if (hallazgoSeleccionado) {
        updatedArchivo.Observacion = hallazgoSeleccionado.descripcion;
      }

      newArchivosPDF[index] = updatedArchivo;
      return newArchivosPDF;
    });
  };

  const handleHallazgoChange = (index: number, hallazgoId: number) => {
    setArchivosPDF((prevArchivosPDF) =>
      prevArchivosPDF.map((item, i) =>
        i === index ? { ...item, selectedHallazgo: hallazgoId } : item
      )
    );
  };

  const agregarObservacionSinArchivo = async () => {
    if (
      !userSeleccionado ||
      !selectedHallazgoSinArchivo ||
      !consecutivoConsulta
    ) {
      toast.warn("Por favor complete todos los campos", { autoClose: 3000 });
      return;
    }

    const hallazgoSeleccionado = hallazgo.find(
      (h) => h.id === selectedHallazgoSinArchivo
    );
    const descripcionObservacion = hallazgoSeleccionado
      ? hallazgoSeleccionado.descripcion
      : "";

    if (!descripcionObservacion) {
      toast.warn("Seleccione una observación válida", { autoClose: 3000 });
      return;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINT}/agregar_observacion_sin_archivo/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AdmisionId: consecutivoConsulta,
            Usuario: userSeleccionado,
            Descripcion: descripcionObservacion,
            TipoArchivo: "Sin Archivo",
          }),
        }
      );



      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      toast.success(responseData.message, { autoClose: 3000 });

      // Limpiar los campos seleccionados
      setUserSeleccionado(null);
      setSelectedHallazgoSinArchivo(null); // Limpiar el estado sin archivo
    } catch (error) {
      console.error("Error al agregar observación sin archivo:", error instanceof Error ? error.message : error);
      toast.error("Error al agregar observación sin archivo", {
        autoClose: 3000,
      });
    }
  };

  const handleEliminarArchivo = async (archivoId: number) => {
    try {
      const response = await eliminarArchivoFacturacion(archivoId);

      if (!response || !response.ok) { // Verifica que response no sea undefined y que la petición fue exitosa
        throw new Error(`Error al eliminar el archivo: ${response ? response.statusText : "Sin respuesta del servidor"}`);
      }

      // Recargar archivos después de eliminar
      await handleConsultaArchivos();

      console.log(`Archivo ${archivoId} eliminado y lista recargada.`);
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
    }
  };

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData.id);
    }
  }, []);

  const handleActualizarRevisor = async () => {
    if (!consecutivoConsulta || !userSeleccionadoT) {
      toast.warn("Debe seleccionar un usuario y una admisión", {
        autoClose: 3000,
      });
      return;
    }

    try {
      await dispatch(enviar_tesoreria(consecutivoConsulta, userSeleccionadoT));
      toast.success("Revisor actualizado correctamente", { autoClose: 3000 });
    } catch (error) {
      console.error("Error al actualizar revisor:", error);
      toast.error("Error al actualizar revisor", { autoClose: 3000 });
    }
  };
  return (
    <>
      <div className="myContainer">
        <Title title="MÃ“DULO DE GESTIÃ“N - CUENTAS MÉDICAS" />
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
            Estudio
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
            startIcon={<SearchIcon />}
            onClick={handleConsultaArchivos}
            variant="contained"
            style={{
              width: "10px",
              height: "38px",
              marginTop: "2px",
              marginLeft: "20px",
            }}></Button>
          <label
            style={{
              marginRight: "10px",
              marginLeft: "100px",
              fontWeight: "bold",
              marginTop: "10px",
            }}>
            Régimen
          </label>

          <Button
            variant="contained"
            color="primary"
            onClick={() => handleRegimenChange("C")}
            sx={{
              width: "150px",
              height: "38px",
              marginTop: "2px",
              marginLeft: "10px",
              backgroundColor: "#1E3A8A", // Azul más oscuro
              "&:hover": {
                backgroundColor: "#1E3A8A", // Azul más oscuro en hover
              },
            }}
            disabled={botonContributivoDisabled && regimen !== ""}>
            Contributivo
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleRegimenChange("S")}
            sx={{
              width: "150px",
              height: "38px",
              marginTop: "2px",
              marginLeft: "10px",
              backgroundColor: "#1E3A8A", // Azul más oscuro
              "&:hover": {
                backgroundColor: "#1E3A8A", // Azul más oscuro en hover
              },
            }}
            disabled={botonSubsidiadoDisabled && regimen !== ""}>
            Subsidiado
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (botonContributivoDisabled && !botonSubsidiadoDisabled) {
                handleRegimenChange("C");
              } else if (
                !botonContributivoDisabled &&
                botonSubsidiadoDisabled
              ) {
                handleRegimenChange("S");
              } else {
                console.error("Seleccione un régimen para cambiar");
              }
            }}
            sx={{
              width: "150px",
              height: "38px",
              marginTop: "2px",
              marginLeft: "10px",
              backgroundColor: "red",
              color: "white",
              borderColor: "red",
            }}>
            Cambiar
          </Button>
        </div>

        {admisionData ? (
          <>
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
                  value={(admisionData as any).NombreEntidad || (admisionData as any).ContratoAlias || admisionData.CodigoEntidad}
                  readOnly
                  style={{ width: "300px" }}
                />
                <label htmlFor="codigoentidadInput">Entidad / Contrato</label>
              </span>
              <span className="p-float-label">
                <InputText
                  id="nombrecompletoInput"
                  value={(admisionData as any).NombreCompleto || admisionData.NombreResponsable || ""}
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
            <div
              className="input-container"
              style={{
                display: "flex",
                marginTop: "40px",
                justifyContent: "center",
                marginBottom: "25px",
              }}>
              <span className="p-float-label">
                <InputText
                  id="nombrecompletoInput"
                  value={(admisionData as any).CUV || ''}
                  readOnly
                  style={{
                    fontSize: "16px",
                    width: "1000px",
                    marginLeft: "20px",
                  }}
                />
                <label
                  htmlFor="nombrecompletoInput"
                  style={{
                    width: "450px",
                    marginLeft: "20px",
                  }}>
                  Código CUV
                </label>
              </span>
            </div>
          </>
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
                  onClick={() => item.IdArchivo !== undefined && DescargarArchivo(item.IdArchivo)}>
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
                            value={item.selectedHallazgo || ""}
                            onChange={(e) =>
                              handleHallazgoChange(
                                index,
                                e.target.value as number
                              )
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
                    <label
                      style={{
                        width: "100px",
                        height: "30px",
                        marginLeft: "80px",
                      }}>
                      Aprobado
                    </label>
                    <Checkbox
                      onChange={(e) =>
                        setArchivosPDF((prevArchivosPDF) =>
                          prevArchivosPDF.map((item, i) =>
                            i === index
                              ? { ...item, RevisionPrimera: e.target.checked }
                              : item
                          )
                        )
                      }
                      checked={item.RevisionPrimera || false}
                      style={{
                        width: "10px",
                        height: "50px",
                      }}
                    />
                  </>
                )}
                {(userId === 182 || userId === 199 || userId === 209 || userId === 214) && (
                  <Button
                    style={{
                      width: "100px",
                      marginLeft: "38px",
                      backgroundColor: "red",
                      color: "white",
                    }}
                    onClick={() => {
                      if (item.IdArchivo !== undefined) {
                        handleEliminarArchivo(item.IdArchivo);
                      } else {
                        console.error("IdArchivo is undefined");
                      }
                    }}>
                    Eliminar
                  </Button>
                )}
              </div>

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
          <div
            className="container"
            style={{
              marginLeft: "5px",
              marginTop: "40px",
              marginBottom: "30px",
              marginRight: "5px",
              justifyContent: "center",
            }}>
            {observaciones.map((obs, index) => (
              <TextField
                key={index}
                label={`Observación ${index + 1}`}
                variant="outlined"
                value={obs.Descripcion}
                onChange={(e) => {
                  const newObservaciones = [...observaciones];
                  newObservaciones[index].Descripcion = e.target.value;
                  setObservaciones(newObservaciones);
                }}
                style={{
                  width: "500px",
                  marginTop: "20px",
                  marginRight: "10px",
                }}
              />
            ))}
          </div>
          {archivosPDF.length > 0 && (
            <div
              className="container"
              style={{
                marginLeft: "0px",
                marginTop: "40px",
                marginBottom: "30px",

                justifyContent: "center",
              }}>
              <Button
                onClick={enviarDataAlBackend}
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                style={{
                  marginLeft: "10px",
                  height: "40px",
                  marginTop: "20px",
                  marginRight: "20px",
                  width: "200px",
                }}>
                Guardar
              </Button>

              <label
                style={{
                  marginRight: "10px",
                  marginLeft: "500px",
                  fontWeight: "bold",
                  marginTop: "60px",
                }}>
                Enviar Admision a Tesoreria
              </label>

              <FormControl
                variant="outlined"
                fullWidth
                style={{
                  width: "200px",
                  backgroundColor: "white",
                  height: "10px",
                  marginTop: "20px",
                  marginLeft: "10px",
                }}>
                <InputLabel id="user-tesoreria">Usuario</InputLabel>
                <Select
                  labelId="user-tesoreria"
                  value={userSeleccionadoT}
                  onChange={(e) =>
                    setUserSeleccionadoT(e.target.value as number)
                  }
                  label="Usuario">
                  {users.map((user, index) => (
                    <MenuItem key={user.id || index} value={user.id}>
                      {user.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleActualizarRevisor}
                style={{
                  marginLeft: "10px",
                  height: "55px",
                  marginTop: "20px",
                  marginRight: "10px",
                }}>
                Enviar
              </Button>
            </div>
          )}
        </div>
      </div>

      <label
        style={{
          marginRight: "10px",
          marginLeft: "100px",
          fontWeight: "bold",
          marginTop: "30px",
        }}>
        Asignar Observacion
      </label>
      <FormControl
        variant="outlined"
        fullWidth
        style={{ width: "250px", backgroundColor: "white" }}>
        <InputLabel id="user-select-select">Usuario</InputLabel>
        <Select
          labelId="user-select-select"
          value={userSeleccionado}
          onChange={(e) => setUserSeleccionado(e.target.value as number)}
          label="Usuario">
          {users.map((user, index) => (
            <MenuItem key={user.id || index} value={user.id}>
              {user.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        variant="outlined"
        fullWidth
        style={{
          width: "400px",
          backgroundColor: "white",
          marginLeft: "10px",
          marginRight: "10px"
        }}>
        <InputLabel id="hallazgo-sin-archivo-label">
          Observación Sin Archivo
        </InputLabel>
        <Select
          labelId="hallazgo-sin-archivo-label"
          value={selectedHallazgoSinArchivo || ""}
          onChange={(e) =>
            setSelectedHallazgoSinArchivo(e.target.value as number)
          }
          label="Observación Sin Archivo">
          {hallazgo.map((hallazgo: Hallazgo) => (
            <MenuItem key={hallazgo.id} value={hallazgo.id}>
              {hallazgo.descripcion}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={agregarObservacionSinArchivo}
        style={{ height: "55px", marginRight: "10px" }}>
        Agregar Observación
      </Button>

    </>
  );
};
