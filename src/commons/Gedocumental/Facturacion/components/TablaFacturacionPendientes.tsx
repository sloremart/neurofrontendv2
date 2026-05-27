import React, { useState } from "react";
import {
  DataGrid,
  GridRenderCellParams,
  GridToolbarExport,
  type GridColDef,
} from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store.ts";
import { Title } from "../../../../components/Title.tsx";
import {
  actualizarModificadoRevisor,
  get_admision_pendiente,
} from "../../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import WarningIcon from "@mui/icons-material/Warning";
import { Checkbox, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { PrimeReactProvider } from "primereact/api";

export const TablaFacturacionPendientes = () => {
  const { admision_pendientes_facturacion } = useSelector(
    (state: RootState) => state.talento_humano
  );
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const handleCheckboxChange = async (row, type) => {
    if (type === "cuentas_medicas") {
      await actualizarModificadoRevisor(
        row.Consecutivo,
        "cuentas_medicas"
      )(dispatch);
    } else if (type === "tesoreria") {
      await actualizarModificadoRevisor(row.Consecutivo, "tesoreria")(dispatch);
    }

    // Actualizar la lista después de realizar las modificaciones
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      dispatch(get_admision_pendiente(userData.id));
    }
  };

  const columns: GridColDef[] = [
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
    {
      field: "Consecutivo",
      headerName: "Núm. Admisión",
      width: 100,
      cellClassName: "truncate-cell",
    },
    {
      field: "IdPaciente",
      headerName: "Identificacion",
      width: 100,
      flex: 1,
      cellClassName: "truncate-cell",
    },
    {
      field: "CodigoEntidad",
      headerName: "Entidad",
      width: 100,
      cellClassName: "truncate-cell",
    },
    {
      field: "NombreResponsable",
      headerName: "Nombre",
      width: 300,
      flex: 1,
    },
    {
      field: "FacturaNo",
      headerName: "Factura",
      width: 100,
      cellClassName: "truncate-cell",
    },
    {
      field: "DiasActiva",
      headerName: "Días Activa",
      width: 150,
      cellClassName: "truncate-cell",
      valueGetter: (params) => {
        const fechaObservacion = new Date(params.row.FechaRecienteObservacion);
        if (isNaN(fechaObservacion.getTime())) {
          return "Fecha inválida";
        }
        const fechaActual = new Date();
        const diferenciaEnMilisegundos =
          fechaActual.getTime() - fechaObservacion.getTime();
        const diferenciaEnDias = Math.floor(
          diferenciaEnMilisegundos / (1000 * 60 * 60 * 24)
        );
        return diferenciaEnDias;
      },
    },
    {
      field: "Pendientes",
      headerName: "Admisión por revisar",
      width: 100,
      flex: 1,
      renderCell: (params) => {
        const diasActiva = params.row.DiasActiva;
        let color = "orange"; // Por defecto, el color es naranja
        if (diasActiva && diasActiva > 5) {
          color = "red"; // Si los días activos son mayores que 5, cambia el color a rojo
        }
        return (
          <span>
            <WarningIcon style={{ color }} />
          </span>
        );
      },
    },
    {
      field: "Modificado1",
      headerName: "Enviado",
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
    {
      field: "cuentas_medicas",
      headerName: "Cuentas Médicas",
      width: 150,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.cuentas_medicas}
          onChange={() => handleCheckboxChange(params.row, "cuentas_medicas")}
        />
      ),
    },
  ];

  // Esta función se llamará al hacer clic en el botón "Cargar Admisiones"
  const fetchData = async () => {
    setLoading(true); // Inicia el estado de carga
    try {
      const userDataString = localStorage.getItem("userData");
      if (!userDataString) {
        console.error(
          "Datos del usuario no encontrados en el almacenamiento local."
        );
        setLoading(false); // Detiene el estado de carga en caso de error
        return;
      }
      const userData = JSON.parse(userDataString);
      console.log(userData);

      // Llamar al servicio para obtener las admisiones pendientes del usuario logueado
      await dispatch(get_admision_pendiente(userData.id));
    } catch (error) {
      console.error("Error al cargar las admisiones pendientes:", error);
    } finally {
      setLoading(false); // Asegura que loading se detenga
    }
  };

  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <PrimeReactProvider>
        <Title title="LISTADO DE ADMISIONES PENDIENTES" />
        <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Button
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: "#1E3A8A",
            "&:hover": {
              backgroundColor: "#1E3A8A",
            },
          }}
          onClick={fetchData} // Asignamos la función al evento onClick
          style={{ marginBottom: "20px" }}>
          Consultar Observaciones
        </Button>
        </div>
        <div
          style={{
            height: 400,
            width: "95%",
            display: "flex",
            justifyContent: "center",
          }}>
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
            }}
            density="compact"
            columns={columns}
            getRowId={(row) => row.Consecutivo}
            loading={loading}
            rows={admision_pendientes_facturacion}
            components={{
              Toolbar: GridToolbarExport,
            }}
          />
        </div>
      </PrimeReactProvider>
    </div>
  );
};

