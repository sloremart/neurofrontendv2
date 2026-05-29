/* eslint-disable no-lone-blocks */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { PrimeReactProvider } from "primereact/api";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { toast } from "react-toastify";

import CONFIG from "../../../../config/api";
import { IAdmisiones } from "../../../interfaces/GeDocumental";
import { Title } from "../../../../components/Title.tsx";
import { AdmsionFacturacion } from "../../../../components/AdmisionArchivos.tsx";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Observacion {
  AdmisionId: number;
  Descripcion: string;
  TipoArchivo: string;
  FechaObservacion: string;
  id: number;
  Revisada: boolean;
}

export const GeDocumentalResultados = () => {
  const [consecutivo, setConsecutivo] = useState<string>("");
  const [admisionData, setAdmisionData] = useState<IAdmisiones | null>(null);
  const [archivos, setArchivos] = useState<{ file: File; tipoDocumento: any }[]>(
    []
  );
  const [uploadedPDF, setUploadedPDF] = useState<File | null>(null);
  const [archivosCargados, setArchivosCargados] = useState<{
    [key: string]: boolean;
  }>({});
  const [botonesGuardadoHabilitados, setBotonesGuardadoHabilitados] = useState<{
    [key: string]: boolean;
  }>({});
  const [enviarArchivos, setEnviarArchivos] = useState(false);
  const [archivosCargadosInfo, setArchivosCargadosInfo] = useState<{
    [key: string]: string;
  }>({});
  const [regimen, setRegimen] = useState("");
  const [botonContributivoDisabled, setBotonContributivoDisabled] =
    useState(false);
  const [botonSubsidiadoDisabled, setBotonSubsidiadoDisabled] = useState(false);
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(null);
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string>("");
  const API_ENDPOINT = CONFIG.API_ENDPOINT;
  const [examList, setExamList] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [uploadedPDFName, setUploadedPDFName] = useState<string | null>("Seleccionar PDF");
  const [tipoHallazgo, setTipoHallazgo] = useState<string>("0");

  const handleTipoHallazgoChange = (event: SelectChangeEvent<string>) => {
    setTipoHallazgo(event.target.value);
  };
  useEffect(() => {
    if (enviarArchivos) {
      archivos.forEach((archivo) => {
        handleGuardarArchivos([archivo], archivo.tipoDocumento);
        setBotonesGuardadoHabilitados((prevBotones) => ({
          ...prevBotones,
          [archivo.tipoDocumento]: true,
        }));
      });
      setEnviarArchivos(false);
    }
  }, [archivos, enviarArchivos]);

  const fetchExamList = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/examenes/`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const responseData = await response.json();
      setExamList(responseData); // Save exam list to state
      toast.success("Lista de exÃ¡menes obtenida correctamente", { autoClose: 3000 });
    } catch (error: any) {
      console.error("Error fetching exam list:", error.message);
      toast.error("Error al obtener la lista de exÃ¡menes", { autoClose: 3000 });
    }
  };

  useEffect(() => {
    if (admisionData) {
      const initialState = admisionData.TiposDocumentos.reduce(
        (acc, tipoDocumento) => {
          acc[tipoDocumento] = false;
          return acc;
        },
        {}
      );
      setBotonesGuardadoHabilitados(initialState);
    }
  }, [admisionData]);

  useEffect(() => {
    fetchExamList();
  }, []);

  const handleExamSelection = (event: SelectChangeEvent<string>) => {
    const selectedId = event.target.value;
    setSelectedExam(selectedId);
    console.log("Exam ID selected:", selectedId);
  };



  const fetchData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/gedocumental/admisiones/${consecutivo}/`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const responseData = await response.json();
      const data = responseData.data;
      setAdmisionData(data);
      if (data.ContratoRegimen === 1) {
        handleRegimenChange("C");
      } else if (data.ContratoRegimen === 2) {
        handleRegimenChange("S");
      } else {
        const alias = (data.ContratoAlias || "").toUpperCase();
        if (alias.includes("CONTRIBUTIVO")) handleRegimenChange("C");
        else if (alias.includes("SUBSIDIADO")) handleRegimenChange("S");
      }
      toast.success("Datos de admisiÃ³n obtenidos correctamente", {
        autoClose: 3000,
      });
    } catch (error) {
      toast.error("Error al obtener la informaciÃ³n de la admisiÃ³n", {
        autoClose: 3000,
      });
    }
  };


  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData.id);
    }
  }, []);

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setUploadedPDF(file);
      setUploadedPDFName(file.name);
      toast.success(`Archivo ${file.name} seleccionado.`, { autoClose: 3000 });
    }
  };


  const handleConsecutivoChange = (event) => {
    setConsecutivo(event.target.value);
  };


  const handleFileInputChange = (event, tipoDocumento) => {
    const uploadedFiles: File[] = Array.from(event.target.files);
    setArchivos((prevArchivos) => [
      ...prevArchivos,
      ...uploadedFiles.map((file) => ({ file, tipoDocumento })),
    ]);
    const fileNames = uploadedFiles.map((file) => file.name).join(", ");
    setArchivosCargados((prevArchivosCargados) => ({
      ...prevArchivosCargados,
      [tipoDocumento]: true,
    }));
    setArchivosCargadosInfo((prevInfo) => ({
      ...prevInfo,
      [tipoDocumento]: prevInfo[tipoDocumento]
        ? prevInfo[tipoDocumento] + ", " + fileNames
        : fileNames,
    }));
  };


  const handleEliminarArchivo = (tipoDocumento) => {
    setArchivos((prevArchivos) =>
      prevArchivos.filter((archivo) => archivo.tipoDocumento !== tipoDocumento)
    );
    setArchivosCargados((prevArchivosCargados) => ({
      ...prevArchivosCargados,
      [tipoDocumento]: false,
    }));
    setArchivosCargadosInfo((prevInfo) => {
      const { [tipoDocumento]: deletedItem, ...rest } = prevInfo;
      return rest;
    });
  };

  // FunciÃ³n para guardar los archivos
  const handleGuardarArchivos = async (archivosAGuardar, tipoDocumento) => {
    try {
      if (archivosAGuardar.length === 0) {
        toast.warn("No hay archivos para enviar.");
        return;
      }
      const userDataString = localStorage.getItem("userData");
      if (!userDataString) return;

      const userData = JSON.parse(userDataString);
      const formData = new FormData();
      archivosAGuardar.forEach((archivo) => {
        formData.append("files", archivo.file);
        formData.append("tipoDocumentos", archivo.tipoDocumento);
      });
      formData.append("consecutivo", consecutivo);
      formData.append("userId", userData.id);
      formData.append("regimen", regimen);
      formData.append("tipoHallazgo", tipoHallazgo);

      const url = `${API_ENDPOINT}/gedocumental/archivos/${consecutivo}/`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.detail || `Error ${response.status}`);
      }

      toast.success("Archivos guardados correctamente.");
      setBotonesGuardadoHabilitados((prevState) => ({
        ...prevState,
        [tipoDocumento]: true,
      }));
    } catch (error) {
      toast.error(error.message || "Error al enviar archivos.");
    }
  };

  // Cambia el rÃ©gimen (contributivo o subsidiado)
  const handleRegimenChange = (regimen) => {
    setRegimen(regimen);
    if (regimen === "C") {
      setBotonContributivoDisabled(true);
      setBotonSubsidiadoDisabled(false);
    } else if (regimen === "S") {
      setBotonContributivoDisabled(false);
      setBotonSubsidiadoDisabled(true);
    }
  };
  const handleUploadToServer = async () => {
    // Validar que los campos necesarios estÃ¡n presentes
    if (!admisionData || !selectedExam || !selectedDateInicio || !selectedDateFin || !uploadedPDF) {
      toast.error("Por favor, complete todos los campos antes de guardar.", { autoClose: 3000 });
      return;
    }

    // Preparar el formulario de datos
    const formData = new FormData();
    formData.append("file", uploadedPDF);

    // Agregar los campos de nombres y apellidos
    formData.append("papellido", admisionData?.Apellido1 || ""); // Primer apellido
    formData.append("sapellido", admisionData?.Apellido2 || ""); // Segundo apellido
    formData.append("pnombre", admisionData?.Nombre1 || ""); // Primer nombre
    formData.append("snombre", admisionData?.Nombre2 || ""); // Segundo nombre

    // Otros datos relacionados con la admisiÃ³n y el archivo
    formData.append("admision_data", JSON.stringify(admisionData)); // Datos de admisiÃ³n completos
    formData.append("examen_id", selectedExam); // Examen seleccionado
    formData.append("fecha_examen", selectedDateFin.toISOString().split("T")[0]); // Fecha del examen
    formData.append("fecha_resultado", selectedDateInicio.toISOString().split("T")[0]); // Fecha del resultado

    try {
      // Enviar los datos al backend
      const response = await fetch(`${API_ENDPOINT}/examenes/subir/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al guardar el archivo.");
      }

      const responseData = await response.json();
      toast.success("Archivo cargado y datos guardados correctamente.", { autoClose: 3000 });
      console.log("Respuesta del servidor:", responseData);
    } catch (error: any) {
      console.error("Error al guardar:", error.message);
      toast.error(error.message || "Error al guardar el archivo.", { autoClose: 3000 });
    }
  };






  return (
    <>
      <div className="myContainer">
        <Title title="MÃ“DULO DE GESTIÃ“N DOCUMENTAL CARGUE DE RESULTADOS - NEURODX"></Title>
        <PrimeReactProvider>
          <div
            className="input-container"
            style={{
              display: "flex",
              marginLeft: "50px",
              marginTop: "60px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="p-float-label">
              <InputText
                id="in"
                value={consecutivo}
                onChange={handleConsecutivoChange}
              />
              <label htmlFor="in">Estudio</label>
            </span>

            <Button
              onClick={fetchData}
              variant="contained"
              style={{
                width: "200px",
                height: "38px",
                marginTop: "2px",
                marginLeft: "20px",
              }}
            >
              Buscar AdmisiÃ³n
            </Button>

            <label
              style={{
                marginRight: "10px",
                marginLeft: "100px",
                fontWeight: "bold",
              }}
            >
              Seleccionar RÃ©gimen
            </label>

            <Button
              variant="contained"
              color="primary"
              onClick={() => handleRegimenChange("C")}
              disabled={botonContributivoDisabled}
              sx={{
                marginRight: "10px",
                backgroundColor: "#1E3A8A",
                "&:hover": {
                  backgroundColor: "#1E3A8A",
                },
              }}
              style={{ marginRight: "20px", marginLeft: "20px" }}
            >
              Contributivo
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleRegimenChange("S")}
              disabled={botonSubsidiadoDisabled}
              sx={{
                marginRight: "10px",
                backgroundColor: "#1E3A8A",
                "&:hover": {
                  backgroundColor: "#1E3A8A",
                },
              }}
            >
              Subsidiado
            </Button>
            <FormControl style={{ marginLeft: "20px", width: "250px" }}>
            <InputLabel id="tipo-hallazgo-label">Tipo de Hallazgo</InputLabel>
            <Select
              labelId="tipo-hallazgo-label"
              id="tipo-hallazgo-select"
              value={tipoHallazgo}
              onChange={handleTipoHallazgoChange}
            >
              <MenuItem value="0">No tiene hallazgo</MenuItem>
              <MenuItem value="1">Tiene hallazgo</MenuItem>
            </Select>
          </FormControl>
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
              }}>
              <span className="p-float-label">
                <InputText
                  id="facturanoInput"
                  value={`${admisionData.Prefijo || ""}${admisionData.FacturaNo
                    }`}
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
                  value={admisionData.ContratoAlias || admisionData.NombreEntidad || admisionData.CodigoEntidad}
                  readOnly
                />
                <label htmlFor="codigoentidadInput">Entidad</label>
              </span>
              <span className="p-float-label">
                <InputText
                  id="nombrecompletoInput"
                  value={admisionData.NombreCompleto || admisionData.NombreResponsable || ''}
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
                  NÃºmero de identificaciÃ³n
                </label>
              </span>
            </div>
          ) : (
            <p>{consecutivo ? "" : ""}</p>
          )}

          {admisionData && (
            <div
              className="input-container"
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "45px",
                marginRight: "45px",
                justifyContent: "center",
                marginTop: "20px",
              }}
            >
              {admisionData.TiposDocumentos.filter(
                (tipoDocumento) => tipoDocumento === "RESULTADO"
              ).map((tipoDocumento, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    id={`fileInput-${index}`}
                    multiple
                    type="file"
                    onChange={(event) => handleFileInputChange(event, tipoDocumento)}
                  />
                  <label htmlFor={`fileInput-${index}`}>
                    <Button
                      variant="outlined"
                      color="primary"
                      component="span"
                      style={{ minWidth: "250px" }}
                      disabled={archivosCargados[tipoDocumento]}
                    >
                      Cargar {tipoDocumento}
                    </Button>
                  </label>

                  <TextField
                    id={`archivosCargadosInfo-${index}`}
                    label={`Archivos Cargados - ${tipoDocumento}`}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    value={archivosCargadosInfo[tipoDocumento] || ""}
                    disabled
                    style={{
                      flex: 1,
                      marginRight: "10px",
                      maxWidth: "500px",
                      marginLeft: "60px",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Button
                      startIcon={<SaveIcon />}
                      variant="contained"
                      color="primary"
                      title="Guardar"
                      disabled={botonesGuardadoHabilitados[tipoDocumento]}
                      style={{ minWidth: "20px" }}
                      onClick={() =>
                        handleGuardarArchivos(
                          archivos.filter((archivo) => archivo.tipoDocumento === tipoDocumento),
                          tipoDocumento
                        )
                      }
                    ></Button>
                    <Button
                      variant="contained"
                      startIcon={<DeleteForeverIcon />}
                      color="secondary"
                      style={{ marginLeft: "10px" }}
                      onClick={() => handleEliminarArchivo(tipoDocumento)}
                    ></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

         

        </PrimeReactProvider>


        <Title title="GUARDAR RESULTADOS "></Title>
        <div style={{ marginTop: "20px", display: "flex", marginLeft: "40px" }}>
          <FormControl style={{ width: "600px" }}>
            <InputLabel id="exam-select-label">Seleccionar Examen</InputLabel>
            <Select
              labelId="exam-select-label"
              id="exam-select"
              value={selectedExam}
              onChange={handleExamSelection}
            >
              {examList.map((exam: any) => (
                <MenuItem key={exam.id} value={exam.id}> {/* Usar `id` como value */}
                  {exam.nombre} {/* Mostrar el nombre del examen */}
                </MenuItem>
              ))}
            </Select>


          </FormControl>
          <div style={{ marginLeft: "20px", width: "200px", backgroundColor: "white" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha Resultado"
                value={selectedDateInicio}
                onChange={(newDate) => setSelectedDateInicio(newDate)}
              />
            </LocalizationProvider>
          </div>

          {/* End Date Picker */}
          <div style={{ marginLeft: "20px", width: "200px", backgroundColor: "white" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha Examen"
                value={selectedDateFin}
                onChange={(newDate) => setSelectedDateFin(newDate)}
              />
            </LocalizationProvider>
          </div>
          <div style={{ marginLeft: "20px" }}>
            <Button
              variant="outlined"
              component="label"
              style={{ height: "40px", minWidth: "250px" }}
            >
              {uploadedPDFName || "Seleccionar PDF"} {/* Muestra el nombre del archivo o el texto predeterminado */}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={handlePDFUpload}
              />
            </Button>
          </div>


        </div>


        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: "20px", marginLeft: "40px", justifyItems: "center" }}
          onClick={handleUploadToServer}
        >
          Guardar Archivo y Datos
        </Button>


        <Title title="CONSULTA DE ARCHIVOS GUARDADOS"></Title>
        <AdmsionFacturacion />
      </div>
    </>
  );
};
