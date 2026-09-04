import React, { useState } from "react";
import {
  DataGrid, GridRenderCellParams, GridToolbarExport, type GridColDef,
} from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  Autocomplete, TextField, Box, Button,
  Checkbox, Chip,
} from "@mui/material";
import { RootState } from "../../../../store/store.ts";
import { IObjUsuarios } from "../../../Login/interface/InterfaceLogin.ts";
import {
  actualizarModificadoRevisor, get_admision_pendiente,
} from "../../TalentoHumano/store/thunks/TalentoHumanoThunks.tsx";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import SearchIcon from "@mui/icons-material/Search";

interface TablaFacturacionPendientesProps {
  userId?: string | number;
  isLider?: boolean;
  users?: IObjUsuarios[];
  selectedUserId?: string;
  onUserChange?: (id: string) => void;
}

const HEADER_SX = {
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #381A73 0%, #1E2E71 60%, #0F4374 100%)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  "& .MuiDataGrid-columnHeaderTitle": { color: "#fff", fontWeight: 700 },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "rgba(255,255,255,0.7)" },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F5F3FF" },
  "& .MuiDataGrid-row.Mui-selected": { bgcolor: "#EDE9FE" },
  borderRadius: 2,
  border: "1px solid #E5E7EB",
};

export const TablaFacturacionPendientes = ({
  userId: userIdProp, isLider, users = [], selectedUserId, onUserChange,
}: TablaFacturacionPendientesProps) => {
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

  const handleCheckboxChange = async (row: any, type: string) => {
    if (type === "cuentas_medicas") {
      await actualizarModificadoRevisor(row.Consecutivo, "cuentas_medicas")(dispatch);
    } else if (type === "tesoreria") {
      await actualizarModificadoRevisor(row.Consecutivo, "tesoreria")(dispatch);
    }
    dispatch(get_admision_pendiente(getEffectiveUserId()));
  };

  const columns: GridColDef[] = [
    {
      field: "no", headerName: "No.", width: 60,
      renderCell: (p: GridRenderCellParams<any>) => {
        const allRows = p.api.getSortedRowIds();
        return allRows.indexOf(p.id) + 1;
      },
    },
    { field: "Consecutivo", headerName: "Núm. Admisión", width: 110 },
    { field: "IdPaciente", headerName: "Identificación", width: 110, flex: 1 },
    { field: "CodigoEntidad", headerName: "Entidad", width: 100 },
    { field: "NombreResponsable", headerName: "Nombre", width: 250, flex: 1 },
    { field: "FacturaNo", headerName: "Factura", width: 100 },
    {
      field: "DiasActiva", headerName: "Días Activa", width: 100,
      valueGetter: (p) => {
        const f = new Date(p.row.FechaRecienteObservacion);
        if (isNaN(f.getTime())) return "—";
        return Math.floor((new Date().getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
      },
      renderCell: (p) => {
        const dias = p.value as number;
        if (typeof dias !== "number") return <span>—</span>;
        return (
          <Chip
            label={`${dias}d`}
            size="small"
            sx={{
              fontWeight: 700, fontSize: 11,
              bgcolor: dias > 5 ? "#FEE2E2" : "#FEF3C7",
              color: dias > 5 ? "#991B1B" : "#92400E",
            }}
          />
        );
      },
    },
    {
      field: "Pendientes", headerName: "Alerta", width: 80,
      renderCell: (p) => {
        const dias = p.row.DiasActiva;
        return <WarningIcon sx={{ color: dias && dias > 5 ? "#EF4444" : "#F59E0B", fontSize: 20 }} />;
      },
    },
    {
      field: "Modificado1", headerName: "Enviado", width: 100,
      renderCell: (p) =>
        p.value
          ? <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 20 }} />
          : <HighlightOffIcon sx={{ color: "#EF4444", fontSize: 20 }} />,
    },
    {
      field: "cuentas_medicas", headerName: "Cuentas Médicas", width: 140,
      renderCell: (p) => (
        <Checkbox
          checked={!!p.row.cuentas_medicas}
          onChange={() => handleCheckboxChange(p.row, "cuentas_medicas")}
          size="small"
          sx={{ color: "#1E2E71", "&.Mui-checked": { color: "#1E2E71" } }}
        />
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const id = getEffectiveUserId();
      if (id) await dispatch(get_admision_pendiente(id));
    } catch (error) {
      console.error("Error al cargar las admisiones pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        {isLider && (
          <Autocomplete
            options={users}
            getOptionLabel={(u) => u.nombre || u.username}
            sx={{ width: 280 }}
            value={users.find((u) => String(u.id) === String(selectedUserId)) || null}
            onChange={(_, v) => onUserChange?.(v ? String(v.id) : "")}
            renderInput={(params) => (
              <TextField {...params} label="Consultar como usuario" size="small" />
            )}
          />
        )}
        <Button
          variant="contained"
          onClick={fetchData}
          startIcon={<SearchIcon />}
          sx={{ background: "linear-gradient(90deg, #381A73, #1E2E71)" }}
        >
          Consultar pendientes
        </Button>
      </Box>
      <DataGrid
        sx={HEADER_SX}
        density="compact"
        autoHeight
        columns={columns}
        getRowId={(row) => row.Consecutivo}
        loading={loading}
        rows={admision_pendientes_facturacion}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        slots={{ toolbar: GridToolbarExport }}
      />
    </Box>
  );
};
