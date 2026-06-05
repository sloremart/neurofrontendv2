import React, { useState } from "react";
import {
  DataGrid,
  GridRenderCellParams,
  GridToolbarExport,
  type GridColDef,
} from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import { Autocomplete, TextField } from "@mui/material";
import { RootState } from "../../../../store/store.ts";
import { Title } from "../../../../components/Title.tsx";
import { IObjUsuarios } from "../../../Login/interface/InterfaceLogin.ts";
import {
  actualizarModificadoRevisor,
  get_admision_pendiente,
} from "../../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import WarningIcon from "@mui/icons-material/Warning";
import { Checkbox, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { PrimeReactProvider } from "primereact/api";

interface TablaFacturacionPendientesProps {
  userId?: string | number;
  isLider?: boolean;
  users?: IObjUsuarios[];
  selectedUserId?: string;
  onUserChange?: (id: string) => void;
}

export const TablaFacturacionPendientes = ({ userId: userIdProp, isLider, users = [], selectedUserId, onUserChange }: TablaFacturacionPendientesProps) => {
  const { admision_pendientes_facturacion } = useSelector(
    (state: RootState) => state.talento_humano
  );
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const getEffectiveUserId = () => {
    if (userIdProp) return String(userIdProp);
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    return userData.id;
  };

  const handleCheckboxChange = async (row, type) => {
    if (type === "cuentas_medicas") {
      await actualizarModificadoRevisor(
        row.Consecutivo,
        "cuentas_medicas"
      )(dispatch);
    } else if (type === "tesoreria") {
      await actualizarModificadoRevisor(row.Consecutivo, "tesoreria")(dispatch);
    }
    dispatch(get_admision_pendiente(getEffectiveUserId()));
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const id = getEffectiveUserId();
      if (!id) { setLoading(false); return; }
      await dispatch(get_admision_pendiente(id));
    } catch (error) {
      console.error("Error al cargar las admisiones pendientes:", error);
    } finally {
      setLoading(false);
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
        <div style={{ marginTop: "20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          {isLider && (
            <Autocomplete
              options={users}
              getOptionLabel={(u) => u.nombre || u.username}
              style={{ width: 280 }}
              value={users.find((u) => String(u.id) === String(selectedUserId)) || null}
              onChange={(_, newValue) => onUserChange?.(newValue ? String(newValue.id) : "")}
              renderInput={(params) => (
                <TextField {...params} label="Consultar como usuario" variant="outlined" size="small" />
              )}
            />
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{ backgroundColor: "#1E3A8A", "&:hover": { backgroundColor: "#1E3A8A" } }}
            onClick={fetchData}
            style={{ marginBottom: "0px", height: "40px" }}>
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

