/* eslint-disable no-lone-blocks */
/* eslint-disable react-hooks/exhaustive-deps */
import ApexCharts from "apexcharts";

import React, { useEffect, useState } from "react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Title } from "../../../components/Title.tsx";
import { useDispatch, useSelector } from "react-redux";
import { Button, Grid, TextField } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { RootState } from "../../../store/store.ts";
import { get_agendamiento } from "../store/thunks/ThunkDashBoardFacturacion.tsx";

export const DashBoardAgendamiento = () => {
  const dispatch = useDispatch();
  const { dash_board_agendamiento } = useSelector(
    (state: RootState) => state.dash_board
  );
  const [totalAmount, setTotalAmount] = useState<number>(0);
  useEffect(() => {
    if (Object.keys(dash_board_agendamiento).length > 0) {
      // Calcular la suma de todas las cantidades
      const sum = Object.values(dash_board_agendamiento.consolidated_data).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      );
      setTotalAmount(sum);
    }
  }, [dash_board_agendamiento]);
  useEffect(() => {
    if (Object.keys(dash_board_agendamiento).length > 0) {
      const options = {
        series: [
          {
            data: [
              
              dash_board_agendamiento.consolidated_data.EstudioPoliConOximetria,              
              dash_board_agendamiento.consolidated_data.Neurologia,
              dash_board_agendamiento.consolidated_data.Ultrasonografia,
              dash_board_agendamiento.consolidated_data.Doppler,
              dash_board_agendamiento.consolidated_data.Radiografia,
              dash_board_agendamiento.consolidated_data.Monitorizacion,
              dash_board_agendamiento.consolidated_data.Electroencefalograma,
              dash_board_agendamiento.consolidated_data.TomografiaSimple,
              dash_board_agendamiento.consolidated_data.TomografiaContrastada,
              dash_board_agendamiento.consolidated_data.MedicamentoTac,
              dash_board_agendamiento.consolidated_data.InsumoTomografia,
              dash_board_agendamiento.consolidated_data.Infiltraciones,
              dash_board_agendamiento.consolidated_data.Fisiatria,
              dash_board_agendamiento.consolidated_data.Otros,
              dash_board_agendamiento.consolidated_data.PolisonografiaTitulacion,
              dash_board_agendamiento.consolidated_data.InyeccionMiorelajante,
              dash_board_agendamiento.consolidated_data.Electromiografia,
              dash_board_agendamiento.consolidated_data.Neuroconduccion,
              dash_board_agendamiento.consolidated_data.Potenciales,
              dash_board_agendamiento.consolidated_data.BloqueoFisiatria,
              dash_board_agendamiento.consolidated_data.Bloqueoneurologia
            ],      


            
      
          },
        ],
        chart: {
          type: "bar",
          height: 350,
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            horizontal: true,
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            colors: ["#000000"], // Color negro
          },
          formatter: function (val) {
            // Formatear el valor como moneda
            return new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(val);
          },

          textAnchor: "start", // Alineación de la etiqueta de datos
          offsetX: 5, // Desplazamiento horizontal de la etiqueta de datos
          minBarHeight: 50, // Altura mínima de la barra para mostrar la etiqueta de datos
          dropShadow: {
            enabled: false,
            blur: 1,
            left: 1,
            top: 1,
          },
        },
        xaxis: {
          categories: [
 
            "EstudioPoliConOximetria",
            "Neurologia",
            "Ultrasonografia",
            "Doppler",
            "Radiografia",
            "Monitorizacion",
            "Electroencefalograma",
            "TomografiaSimple",
            "TomografiaContrastada",
            "MedicamentoTac",
            "InsumoTomografia",
            "Infiltraciones",
            "Fisiatria",
            "Otros",
            "PolisonografiaTitulacion",
            "InyeccionMiorelajante",
            "Electromiografia",
            "Neuroconduccion",
            "Potenciales",
            "BloqueoFisiatria",
            "Bloqueoneurologia",
            
          ],
        },
      };

      const chart = new ApexCharts(
        document.querySelector("#chartagendamiento"),
        options
      );
      chart.render();
    }
  }, [dash_board_agendamiento]);

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const handleFilterClick = async () => {
    if (fechaInicio && fechaFin) {
      // Verificar si se han ingresado ambas fechas
      try {
        await dispatch(get_agendamiento(fechaInicio, fechaFin));
      } catch (error) {
        console.error("Error al obtener las citas:", error);
      }
    } else {
      console.error("Debe seleccionar una fecha de inicio y una fecha final.");
    }
  };

  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}>
      <Title title="INFORME DE AGENDAMIENTO"></Title>

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
            Por especialidad
          </label>
        </Grid>

        <Grid item marginLeft={23}>
          <TextField
            label="Fecha de Inicio"
            variant="outlined"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
        </Grid>

        <Grid item>
          <TextField
            label="Fecha Final"
            variant="outlined"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
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
            style={{ minWidth: "60px", minHeight: "55px" }}>
               Filtrar
            </Button>
        </Grid>
      </Grid>
      <Grid item xs={8} sm={8} id="chartagendamiento"></Grid>
      <Grid item alignItems="center">
        <TextField
          label="Total"
          variant="filled"
          value={totalAmount.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
          InputProps={{
            readOnly: true,
          }}
          
        />
      </Grid>
    </div>
  );
};
