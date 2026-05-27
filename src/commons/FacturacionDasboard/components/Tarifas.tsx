import React, { useEffect, useState } from "react";
import { Title } from "../../../components/Title.tsx";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Grid,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { RootState, AppDispatch } from "../../../store/store";
import {
  get_contrato_tarifa,
  get_tarifas,
} from "../../../commons/FacturacionDasboard/store/thunks/ThunkDashBoardFacturacion.tsx";
import { DataGrid, GridToolbarExport } from "@mui/x-data-grid";

export const Tarifas = () => {
  const dispatch: AppDispatch = useDispatch();
  const { tarifas } = useSelector((state: RootState) => state.dash_board);
  const [codigos, setCodigos] = useState<{ id: number; label: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | "">("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const codigosData = await dispatch(get_contrato_tarifa());
        setCodigos(codigosData);
      } catch (error) {
        console.error("Error al obtener los códigos:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value as number;
    setSelectedOption(value);
  };

  const handleButtonClick = () => {
    if (typeof selectedOption === "number") {
      dispatch(get_tarifas(selectedOption));
    }
  };

  const columns = [
    { field: "CodigoCUPS", headerName: "Código CUPS", width: 300 },
    { field: "DescripcionCUPS", headerName: "Descripción CUPS", width: 800 },
    { 
      field: "Tarifa", 
      headerName: "Tarifa", 
      width: 150,
      valueFormatter: (params) => {
        // Agregar el signo de pesos y formatear los decimales
        return `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      },
    },
  ];
  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <Title title="TARIFAS DE CONTRATOS" />
      <Grid container  alignItems="center" marginTop={5}  justifyContent="center">
        <Grid item xs={12} sm={6} lg={3} marginRight={8}>
          <Select
            value={selectedOption}
            onChange={handleSelectChange}
            fullWidth
            label="Código"
            style={{ width: "150px" }}
            
            sx={{
              backgroundColor: "white",
              minWidth: "400px",
            }}>
            {codigos.map((codigo) => (
              <MenuItem key={codigo.id} value={codigo.id}>
                {codigo.label}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={6} sm={3} >
          <Button
            variant="contained"
            color="primary"
            onClick={handleButtonClick}
            disabled={selectedOption === ""}>
            Consultar Tarifas
          </Button>
        </Grid>
      </Grid>
      <Title title="LISTADO DE TARIFAS" />
      <div style={{ height: 400, width: "90%", marginTop: 20 }}>
      
        <DataGrid
          rows={tarifas}
          getRowId={(row) => row.CodigoCUPS}
          columns={columns}
          components={{
            Toolbar: GridToolbarExport,
          }}
        />
      </div>
    </div>
  );
};
