import React, { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { Button, MenuItem, Select } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

import {
  control_error,
  get_admisiones_radicar,
  get_codigos,
  renombrar_capitalsalud,
  renombrar_colsanitas,
  renombrar_compensar,
  renombrar_medisanitas,
  renombrar_otros,
  renombrar_saludtotal,
  renombrar_san02,
  renombrar_sanitasevento, renombrar_fomag,
  renombrar_policia,
  renombrar_ejercito
} from "../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import { Title } from "../../../components/Title.tsx";
import { AppDispatch, RootState } from "../../../store/store.ts";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export const TablaRadicacion = () => {
  // Obtener estado de Redux y configurar dispatch
  const { admision_cuentas_medicas } = useSelector(
    (state: RootState) => state.talento_humano
  );
  const dispatch = useDispatch();

  // Estados locales
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(
    null
  );
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [codigos, setCodigos] = useState<{ codigo: string; nombre: string }[]>([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [idusuario, setIdusuario] = useState<string | null>(null);
  // Definición de columnas para el DataGrid
  const columns: GridColDef[] = [
    {
      field: "AdmisionId",
      headerName: "Numero de la Admisión",
      width: 100,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "ContratoAlias",
      headerName: "Contrato",
      width: 220,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "NombreResponsable",
      headerName: "Nombre del paciente",
      width: 300,
    },
    {
      field: "RevisionCuentasMedicas",
      headerName: "Auditoria Cuentas Medicas",
      width: 250,
      flex: 1,
      renderCell: (params) => {
        const value = params.value as boolean;
        const iconStyle = {
          color: value ? "green" : "red",
        };
        return value ? (
          <CheckCircleIcon style={iconStyle} />
        ) : (
          <HighlightOffIcon style={iconStyle} />
        );
      },
    },
    {
      field: "FechaCreacionAntares",
      headerName: "Fecha de creación",
      width: 250,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "FechaCreacionArchivo",
      headerName: "Fecha de creación",
      width: 250,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "Radicado",
      headerName: "Renombrado",
      width: 150,
      flex: 1,
      renderCell: (params) => {
        const value = params.value as boolean;
        const iconStyle = {
          color: value ? "green" : "red",
        };
        return value ? (
          <CheckCircleIcon style={iconStyle} />
        ) : (
          <HighlightOffIcon style={iconStyle} />
        );
      },
    },

  ];

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) {
      console.error(
        "Datos del usuario no encontrados en el almacenamiento local."
      );
      return;
    }
    const userData = JSON.parse(userDataString);
    console.log("Datos del usuario:", userData);
    setIdusuario(userData.id); // Guarda el idusuario en el estado local
  }, []);

  // Manejo del clic en el botón de acción
  const handleActionButtonClick = async (
    codigoEntidad: string,
    admisionId: number,
    dispatch: AppDispatch
  ) => {
    setLoading(true);
    try {
      switch (codigoEntidad) {
        case "SALUD TOTAL CONTRIBUTIVO":
        case "SALUD TOTAL SUBSIDIADO":
          if (idusuario) { await dispatch(renombrar_saludtotal(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "SANITAS EVENTO CONTRIBUTIVO":
        case "SANITAS EVENTO SUBSIDIADO":
          if (idusuario) { await dispatch(renombrar_sanitasevento(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "SANITAS MRC CONTRIBUTIVO":
        case "SANITAS MRC SUBSIDIADO":
          if (idusuario) { await dispatch(renombrar_san02(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "COLSANITAS PLAN MODULAR":
        case "COLSANITAS BANCO DE LA REPUBLICA":
        case "COLSANITAS PLAN INTEGRAL":
          if (idusuario) { await dispatch(renombrar_colsanitas(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "CAPITAL SALUD CONTRIBUTIVO":
        case "CAPITAL SALUD SUBSIDIADO":
          if (idusuario) { await dispatch(renombrar_capitalsalud(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "COMPENSAR CONTRIBUTIVO":
        case "COMPENSAR SUBSIDIADO":
          if (idusuario) { await dispatch(renombrar_compensar(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "FOMAG":
          if (idusuario) { await dispatch(renombrar_fomag(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "POLICIA FISIATRIA 084-7-200075-25":
        case "POLICIA ESTUDIOS DEL SUEÑO 084-7-200098-25":
        case "PONAL MEDICINA LABORAL":
          if (idusuario) { await dispatch(renombrar_policia(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "MEDISANITAS":
          if (idusuario) { await dispatch(renombrar_medisanitas(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "EJERCITO":
          if (idusuario) { await dispatch(renombrar_ejercito(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        case "AIR LIQUIDE COLOMBIA":
        case "ARL POSITIVA":
        case "AXA COLPATRIA SEGUROS S.A.":
        case "EQUIPO INTERDISCIPLINARIO PARA EL MEJORAMIENTO DE LA CALIDAD":
        case "BOLIVAR POLIZA":
        case "BOLIVAR SOAT":
        case "EQUIVIDA":
        case "IPS CONSULTORIO MEDICO SALUD OCUPACIONAL S.A.S":
        case "IPS ONCOLIFE":
        case "IPS SOLIMED JD SAS":
        case "MULTISALUD IPS":
        case "MUNDIAL SOAT":
        case "PARTICULAR 10% DESCUENTO":
        case "PARTICULAR 20% DESCUENTO":
        case "PARTICULAR 30% DESCUENTO":
        case "PARTICULAR 40% DESCUENTO":
        case "PARTICULAR 50% DESCUENTO":
        case "PARTICULAR 60% DESCUENTO":
        case "PARTICULAR 70% DESCUENTO":
        case "PARTICULAR 80% DESCUENTO":
        case "PARTICULAR 90% DESCUENTO":
        case "PARTICULAR BONO REGALO":
        case "PARTICULAR TARIFA PLENA":
        case "PREVISORA SOAT":
        case "SEGUROS DEL ESTADO SOAT":
        case "SOLIDARIA SOAT":
        case "SURA POLIZA EVOLUCIONA":
        case "SURA POLIZA GLOBAL Y CLASICO":
        case "SURA SOAT":
          if (idusuario) { await dispatch(renombrar_otros(admisionId, idusuario)); } else { console.error("idusuario no disponible"); }
          break;

        default:
          console.error("Código de entidad no válido:", codigoEntidad);
      }
    } catch (error) {
      console.error("Error al ejecutar el servicio:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener códigos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const codigosData = await dispatch(get_codigos());
        setCodigos(codigosData);
      } catch (error) {
        console.error("Error al obtener los códigos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Manejo del clic en el botón de filtrar
  const handleFilterClick = async () => {
    if (codigoSeleccionado && selectedDateInicio && selectedDateFin) {
      const formattedDateInicio = selectedDateInicio
        .toISOString()
        .split("T")[0]; // Formatea la fecha de inicio como YYYY-MM-DD
      const formattedDateFin = selectedDateFin.toISOString().split("T")[0]; // Formatea la fecha de fin como YYYY-MM-DD
      try {
        setLoading(true);
        const result = await dispatch(
          get_admisiones_radicar(
            codigoSeleccionado,
            formattedDateInicio,
            formattedDateFin
          )
        );

        if (!result.success) {
          control_error(result.detail); // Mostrar el mensaje de error si la consulta no fue exitosa
        }
      } catch (error) {
        console.error("Error al obtener las Admisiones:", error);
        control_error("Error en la consulta de admisiones");
      } finally {
        setLoading(false);
      }
    } else {
      console.error(
        "Debe seleccionar una fecha de inicio, una fecha de fin y una Entidad"
      );
      control_error(
        "Debe seleccionar una fecha de inicio, una fecha de fin y un código"
      );
    }
  };
  const handleRadicarTodasAdmisiones = async () => {
    setLoading(true);
    try {
      if (idusuario) {
        for (const admision of admision_cuentas_medicas) {
          const { ContratoAlias, CodigoEntidad, AdmisionId } = admision;
          const codigoParaRenombrar = ContratoAlias || CodigoEntidad || "";
          if (codigoParaRenombrar && AdmisionId) {
            await handleActionButtonClick(
              codigoParaRenombrar,
              AdmisionId,
              dispatch as AppDispatch
            );
          } else {
            console.error("Datos incompletos para la admisión:", admision);
          }
        }
      } else {
        console.error("idusuario no disponible");
      }
    } catch (error) {
      console.error("Error al radicar todas las admisiones:", error);
    } finally {
      setLoading(false);
    }
  };


  // Renderización del componente
  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "80px",
      }}>
      <Title title="RENOMBRAMIENTO" />

      <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
        <div style={{ width: "150px" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha Inicio"
              value={selectedDateInicio}
              onChange={(newDate) => setSelectedDateInicio(newDate)}
            />
          </LocalizationProvider>
        </div>

        <div style={{ width: "150px" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha Fin"
              value={selectedDateFin}
              onChange={(newDate) => setSelectedDateFin(newDate)}
            />
          </LocalizationProvider>
        </div>

        <Select
          value={codigoSeleccionado}
          onChange={(e) => setCodigoSeleccionado(e.target.value as string)}
          fullWidth
          label="Código"
          style={{ width: "150px" }}
          sx={{
            backgroundColor: "white",
          }}>
          {codigos.map((c) => (
            <MenuItem key={c.codigo} value={c.codigo}>
              {c.nombre} ({c.codigo})
            </MenuItem>
          ))}
        </Select>

        <Button
          startIcon={<FilterAltIcon />}
          variant="outlined"
          onClick={handleFilterClick}
          style={{ width: "150px" }}>
          Filtrar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRadicarTodasAdmisiones}
          startIcon={<CreateNewFolderIcon />}
          style={{ width: "150px" }}>
          Renombrar
        </Button>

      </div>

      <Title title="LISTADO DE ADMISIONES" />

      <div style={{ width: "95%" }}>
        <DataGrid
          sx={{
            backgroundColor: "white",
          }}
          density="compact"
          autoHeight
          columns={columns}
          loading={loading} // Estado de carga aplicado aquí
          getRowId={(row) => row.AdmisionId}
          rows={admision_cuentas_medicas}
        />
      </div>
    </div>
  );
};