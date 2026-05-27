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
import { get_agendamiento_subcentro } from "../store/thunks/ThunkDashBoardFacturacion.tsx";

export const DashBoardSubcentro = () => {
  const dispatch = useDispatch();
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const { dash_board_subcentro } = useSelector(
    (state: RootState) => state.dash_board
  );
  const categories = [
    "Estudios",
    "Neurología",
    "I.Baja complejidad",
    "Alta complejidad",
    "Fisiatría",
    "Otros",
  ];
  useEffect(() => {
    if (Object.keys(dash_board_subcentro).length > 0) {
      // Calcular la suma de todas las cantidades
      const sum = Object.values(dash_board_subcentro.consolidated_data).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      );
      setTotalAmount(sum);
    }
  }, [dash_board_subcentro]);
  useEffect(() => {
    // Renderizar la gráfica inicial cuando se monta el componente
    if (dash_board_subcentro) {
      renderChart(dash_board_subcentro.consolidated_data);
    }
  }, [dash_board_subcentro]);

  const handleFilterClick = async () => {
    if (fechaInicio && fechaFin) {
      try {
        await dispatch(get_agendamiento_subcentro(fechaInicio, fechaFin));
      } catch (error) {
        console.error("Error al obtener las citas:", error);
      }
    } else {
      console.error("Debe seleccionar una fecha de inicio y una fecha final.");
    }
  };

  const renderChart = (data) => {
    const seriesData = Object.values(data);

    const options = {
      series: [
        {
          data: seriesData,
        },
      ],
      chart: {
        height: 350,
        width: "350%",
        type: "bar",
      },

      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: "80%",
        },
      },
      dataLabels: {
        position: "top", // Mostrar las etiquetas de datos en la parte superior de las barras
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
        offsetX: 10, // Desplazamiento horizontal de la etiqueta de datos
        minBarHeight: 20, // Altura mínima de la barra para mostrar la etiqueta de datos
        dropShadow: {
          enabled: false,
          blur: 1,
          left: 1,
          top: 1,
        },
      },
      stroke: {
        width: 0,
      },
      grid: {
        row: {
          colors: ["#fff", "#f2f2f2"],
        },
      },
      xaxis: {
        labels: {
          rotate: -45,
        },
        categories: categories,
        tickPlacement: "on",
      },
      yaxis: {
        title: {
          text: "Servings",
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "horizontal",

          colors: ["#2E93fA"],
          shadeIntensity: 0.25,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [50, 0, 100],
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#chartsubcentro"),
      options
    );
    chart.render();
  };

  return (
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}>
      <Title title="INFORME SUBCENTRO - AGENDAMIENTO"></Title>
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
            Por Subcentro
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

      <div
        id="chartsubcentro"
        style={{ margin: "auto", textAlign: "center" }}></div>

      <Grid item alignItems="center">
        <TextField
          label="Total"
          variant="filled"
          value={totalAmount.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
          })}
          InputProps={{
            readOnly: true,
          }}
        />
      </Grid>
    </div>
  );
};
