/* eslint-disable no-lone-blocks */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Title } from "../../../components/Title.tsx";
import { InputText } from "primereact/inputtext";
import { PrimeReactProvider } from "primereact/api";
import { IAdmisiones } from "../../interfaces/GeDocumental.ts";
import { Button, Checkbox, TextField } from "@mui/material";
import { AdmsionFacturacion } from "../../../components/AdmisionArchivos.tsx";
import CONFIG from "../../../config/api.js";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { TablaFacturacionPendientes } from "./components/TablaFacturacionPendientes.tsx";
import { ObservacionRevisada } from "../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import {
  DataGrid,
  GridRenderCellParams,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { green } from "@mui/material/colors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Observacion {
  AdmisionId: number;
  Descripcion: string;
  TipoArchivo: string;
  FechaObservacion: string;
  id: number;
  Revisada: boolean;
}

export const GeDocumental = () => {
  const navigate = useNavigate();
  const [consecutivo, setConsecutivo] = useState<string>("");
  const [admisionData, setAdmisionData] = useState<IAdmisiones | null>(null);
  const [archivos, setArchivos] = useState<{ file: File; tipoDocumento: any }[]>(
    []
  );
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
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [userId, setUserId] = useState<string>("");
  const API_ENDPOINT = CONFIG.API_ENDPOINT;
  const [loading, setLoading] = useState<boolean>(false);

  // Manejo del archivo y habilitar botones
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

  // Inicializa el estado de los botones de guardar en base a la admisión
  useEffect(() => {
    if (admisionData) {
      const initialState = admisionData.TiposDocumentos.reduce(
        (acc: Record<string, boolean>, tipoDocumento: string) => {
          acc[tipoDocumento] = false;
          return acc;
        },
        {} as Record<string, boolean>
      );
      setBotonesGuardadoHabilitados(initialState);
    }
  }, [admisionData]);

  // Función para marcar una observación como revisada
  const handleCheckboxChange = async (admisionId: number) => {
    if (!admisionId) {
      console.error("AdmisionId is undefined");
      return;
    }
    try {
      await ObservacionRevisada(admisionId);
      handleFetchObservaciones();
    } catch (error) {
      console.error("Error al actualizar la observación:", error instanceof Error ? error.message : error);
    }
  };

  // Buscar datos de admisión en base al consecutivo
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/gedocumental/admisiones/${consecutivo}/`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const responseData = await response.json();
      const data = responseData.data;
      setAdmisionData(data);
      // Auto-seleccionar régimen según el contrato de la admisión
      if (data.ContratoRegimen === 1) {
        handleRegimenChange("C");
      } else if (data.ContratoRegimen === 2) {
        handleRegimenChange("S");
      } else {
        // Si el alias contiene la palabra clave, inferir el régimen
        const alias = (data.ContratoAlias || "").toUpperCase();
        if (alias.includes("CONTRIBUTIVO")) handleRegimenChange("C");
        else if (alias.includes("SUBSIDIADO")) handleRegimenChange("S");
      }
      toast.success("Datos de admisión obtenidos correctamente", {
        autoClose: 3000,
      });
    } catch (error) {
      toast.error("Error al obtener la información de la admisión", {
        autoClose: 3000,
      });
    }
  };

  // Obtener los datos del usuario desde el localStorage
  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData.id);
    }
  }, []);

  // Cambia el consecutivo según el input
  const handleConsecutivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsecutivo(event.target.value);
  };

  // Función para subir archivos
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, tipoDocumento: string) => {
    const uploadedFiles: File[] = Array.from(event.target.files ?? []);
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

  // Función para eliminar un archivo cargado
  const handleEliminarArchivo = (tipoDocumento: string) => {
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

  // Función para guardar los archivos
  const handleGuardarArchivos = async (archivosAGuardar: { file: File; tipoDocumento: string }[], tipoDocumento: string) => {
    try {
      if (archivosAGuardar.length === 0) {
        toast.warn("No hay archivos para enviar.");
        return;
      }
      const userDataString = localStorage.getItem("userData");
      if (!userDataString) return;

      const userData = JSON.parse(userDataString);
      const formData = new FormData();
      archivosAGuardar.forEach((archivo: { file: File; tipoDocumento: string }) => {
        formData.append("files", archivo.file);
        formData.append("tipoDocumentos", archivo.tipoDocumento);
      });
      formData.append("consecutivo", consecutivo);
      formData.append("userId", userData.id);
      formData.append("regimen", regimen);

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
      toast.error(error instanceof Error ? error.message : "Error al enviar archivos.");
    }
  };

  // Cambia el régimen (contributivo o subsidiado)
  const handleRegimenChange = (regimen: string) => {
    setRegimen(regimen);
    if (regimen === "C") {
      setBotonContributivoDisabled(true);
      setBotonSubsidiadoDisabled(false);
    } else if (regimen === "S") {
      setBotonContributivoDisabled(false);
      setBotonSubsidiadoDisabled(true);
    }
  };

  // Función para buscar observaciones
  const handleFetchObservaciones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/gedocumental/observaciones/${userId}/`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const responseData = await response.json();
      setObservaciones(responseData);
      toast.success("Observaciones obtenidas correctamente", {
        autoClose: 3000,
      });
      setLoading(false);
    } catch (error) {
      toast.error("Error al obtener las observaciones", { autoClose: 3000 });
      setLoading(false);
    }
  };

  // Columnas de la tabla de observaciones
  const columns = [
    {
      field: "no",
      headerName: "No.",
      width: 70,
      renderCell: (params: GridRenderCellParams<any>) => {
        const allRows = params.api.getSortedRowIds();
        const index = allRows.indexOf(params.id);
        return index + 1;
      },
    },
    { field: "AdmisionId", headerName: "Admision ID", width: 100 },
    { field: "Descripcion", headerName: "Descripción", width: 800 },
    { field: "TipoArchivo", headerName: "Tipo de Archivo", width: 150 },
    {
      field: "FechaObservacion",
      headerName: "Fecha Observación",
      width: 180,
      valueFormatter: (params: any) => {
        const date = new Date(params.value);
        return date.toLocaleDateString();
      },
    },
    {
      field: "Revisada",
      headerName: "Corregida",
      width: 120,
      renderCell: (params: any) => (
        <Checkbox
          checked={params.row.Revisada}
          onChange={() => handleCheckboxChange(params.row.AdmisionId)}
          sx={{
            color: green[600],
            "&.Mui-checked": {
              color: green[600],
            },
          }}
        />
      ),
    },
  ];

  return (
    <>
      <div className="myContainer">
        <Title title="MÓDULO DE GESTIÓN DOCUMENTAL FACTURACIÓN - NEURODX"></Title>
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
              <label htmlFor="in">Consecutivo</label>
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
              Buscar Admisión
            </Button>

            <label
              style={{
                marginRight: "10px",
                marginLeft: "100px",
                fontWeight: "bold",
              }}
            >
              Seleccionar Régimen
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
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/caja_facturacion")}
              sx={{
                marginLeft: "20px",
                backgroundColor: green[600],
                "&:hover": {
                  backgroundColor: green[700],
                },
              }}
            >
              Caja Facturación
            </Button>
          </div>
          {admisionData ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 2fr 1.5fr",
                gap: "24px",
                marginLeft: "40px",
                marginRight: "40px",
                marginTop: "80px",
                alignItems: "end",
              }}>
              <span className="p-float-label">
                <InputText
                  id="facturanoInput"
                  value={`${admisionData.Prefijo || ""}${admisionData.FacturaNo}`}
                  readOnly
                  style={{ width: "100%", fontSize: "15px" }}
                />
                <label htmlFor="facturanoInput">Factura No</label>
              </span>

              <span className="p-float-label">
                <InputText
                  id="codigoentidadInput"
                  value={admisionData.ContratoAlias || admisionData.NombreEntidad || admisionData.CodigoEntidad}
                  readOnly
                  style={{ width: "100%", fontSize: "15px" }}
                />
                <label htmlFor="codigoentidadInput">Entidad / Contrato</label>
              </span>

              <span className="p-float-label">
                <InputText
                  id="nombrecompletoInput"
                  value={admisionData.NombreCompleto || admisionData.NombreResponsable || ''}
                  readOnly
                  style={{ width: "100%", fontSize: "15px" }}
                />
                <label htmlFor="nombrecompletoInput">Nombre Completo</label>
              </span>

              <span className="p-float-label">
                <InputText
                  id="idpacienteInput"
                  value={admisionData.IdPaciente}
                  readOnly
                  style={{ width: "100%", fontSize: "15px" }}
                />
                <label htmlFor="idpacienteInput">Número de identificación</label>
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
              {admisionData.TiposDocumentos.map((tipoDocumento, index) => (
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
                    onChange={(event) =>
                      handleFileInputChange(event, tipoDocumento)
                    }
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
                          archivos.filter(
                            (archivo) =>
                              archivo.tipoDocumento === tipoDocumento
                          ),
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

        <TablaFacturacionPendientes />

        <div
          className="myContainer"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <PrimeReactProvider>
            <Title title="OBSERVACIONES PENDIENTES SIN ARCHIVOS" />
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFetchObservaciones}
                sx={{
                  backgroundColor: "#1E3A8A",
                  "&:hover": {
                    backgroundColor: "#1E3A8A",
                  },
                }}
              >
                Consultar Observaciones
              </Button>
            </div>
            <div
              style={{ height: 400, width: "95%", justifyContent: "center" }}
            >
              <DataGrid
                sx={{
                  backgroundColor: "white",
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  "& .MuiDataGrid-columnHeader": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  marginTop: "20px"
                }}
                rows={observaciones}
                columns={columns}
                getRowId={(row) => row.id}
                loading={loading}
                slots={{
                  toolbar: GridToolbarExport,
                }}
              />
            </div>
          </PrimeReactProvider>
        </div>

        <Title title="CONSULTA DE ARCHIVOS GUARDADOS"></Title>
        <AdmsionFacturacion />
      </div>
    </>
  );
};
