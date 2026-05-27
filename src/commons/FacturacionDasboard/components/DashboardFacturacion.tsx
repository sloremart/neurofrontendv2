/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable no-lone-blocks */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from "react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Title } from "../../../components/Title.tsx";
import { useDispatch, useSelector } from "react-redux";
import { get_facturas } from "../store/thunks/ThunkDashBoardFacturacion.tsx";
import {
  Button,
  FormControl,
  Grid,
  InputAdornment,
  OutlinedInput,
  Stack,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import { Gauge } from "@mui/x-charts/Gauge";
import "dayjs/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { RootState } from "../../../store/store.ts";
import { DashBoardAgendamiento } from "./DashBoardAgendamiento.tsx";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { DashBoardSubcentro } from "./DashBoardSubcentro.tsx";
export const DashBoardFacturacion = () => {
 
  const dispatch = useDispatch();
  const { dash_board_facturacion } = useSelector(
    (state: RootState) => state.dash_board
  );
  const [fechaIngresada, setFechaIngresada] = useState<string>("");
  const [totalSum, setTotalSum] = useState<number>(0);
  const maxLimit = 30000000;
  dayjs.locale("es");


  const handleFilterClick = async () => {
    if (fechaIngresada) { // Verificar si se ha ingresado una fecha
      try {
        await dispatch(get_facturas(fechaIngresada));
      } catch (error) {
        console.error("Error al obtener las citas:", error);
      }
    } else {
      console.error("Debe seleccionar una fecha.");
    }
  };




  const calcularTotalSum = (data: any[]) => {
    let sum = 0;
    data.forEach((item) => {
      sum += item.TotalFactura;
    });
    console.log("Suma total:", sum);
    return sum;
  };

  React.useEffect(() => {
    if (dash_board_facturacion && dash_board_facturacion.length > 0) {
      const sum = calcularTotalSum(dash_board_facturacion);
      setTotalSum(sum);
    }
  }, [dash_board_facturacion]);

  return (
    <>
      <div
        className="myContainer"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}>
        <Title title="DASH BOARD FACTURACIÓN - NEURODX"></Title>

        <Grid container spacing={2} alignItems="center" marginTop={5}>
          <Grid item marginLeft={30}>
            <label
              htmlFor="in"
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                color: "#333",
                textTransform: "uppercase",
              }}>
              Facturación Diaria
            </label>
          </Grid>

         
          <Grid item marginLeft={20}>
            <TextField
              id="fecha"
              label="Fecha"
              variant="outlined"
              type="date"
              value={fechaIngresada}
              onChange={(e) => setFechaIngresada(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Grid>
        

          <Grid item>
            <Button
              startIcon={<FilterAltIcon />}
              variant="outlined"
              onClick={handleFilterClick}
              style={{ minWidth: "60px", minHeight: "55px" }} 
            />
          </Grid>

          <Grid item xs={4} sm={1.5}>
            <FormControl fullWidth variant="outlined">
              <OutlinedInput
                value={totalSum.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                startAdornment={
                  <InputAdornment position="start" style={{ fontSize: "22px" }}>
                    {""}
                    {/* Ajusta el tamaño del icono */}$
                  </InputAdornment>
                }
                style={{ fontSize: "20px" }}
                readOnly
              />
            </FormControl>
          </Grid>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 6, md: 5 }}
            marginLeft={6}>
            <Gauge
              width={200}
              height={200}
              value={(totalSum / maxLimit) * 100}
              max={100}
            />
          </Stack>
        </Grid>
      </div>
      <DashBoardSubcentro />
      <DashBoardAgendamiento />
     

    </>
  );
};
