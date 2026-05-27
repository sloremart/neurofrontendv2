import React, { useEffect, useState } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
// import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";

import ApexCharts from 'apexcharts';
import { FormControl, InputLabel } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button, MenuItem, Select } from "@mui/material";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { RootState } from "../../../store/store";
import { get_users } from "../../Login/store/thunks/ThunksLogin.tsx";
import { get_admisiones_facturador } from "../store/thunks/AuditoriaDashboardthunks.tsx";
import { Title } from "../../../components/Title.tsx";
import { AuditoriaCm } from "../components/AuditoriaCm.tsx";
import { TablaPendientesUsuario } from "../components/TablaPendientesUsuario.tsx";

export const AuditoriaDashboard = () => {
  const { users } = useSelector((state: RootState) => state.users);
  const admisiones_facturador = useSelector((state: RootState) => state.auditoria_dashboard.admisiones_facturador);
  const dispatch = useDispatch();

  const [userSeleccionado, setUserSeleccionado] = useState<number[]>([]);
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(null);
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);
  const [chartsRendered, setChartsRendered] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(get_users());
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleFilterClick = async () => {
    if (selectedDateInicio && selectedDateFin && userSeleccionado.length > 0) {
      const formattedDateInicio = selectedDateInicio.toISOString().split("T")[0];
      const formattedDateFin = selectedDateFin.toISOString().split("T")[0];

      try {
        await dispatch(
          get_admisiones_facturador(
            userSeleccionado,
            formattedDateInicio,
            formattedDateFin,
          )
        );
        setChartsRendered(true);
      } catch (error) {
        console.error("Error al obtener las admisiones:", error);
      }
    } else {
      console.error("Debe seleccionar una fecha, revisión y al menos un usuario.");
    }
  };

  useEffect(() => {
    if (chartsRendered && admisiones_facturador && Object.keys(admisiones_facturador).length > 0) {
      console.log("Datos para el gráfico:", admisiones_facturador);  // Añade un log para depuración
      renderCharts(admisiones_facturador);
    }
  }, [admisiones_facturador, chartsRendered]);

  const renderCharts = (admisionesData) => {
    if (!admisionesData || Object.keys(admisionesData).length === 0) {
      console.error("No se encontraron datos para renderizar los gráficos.");
      return;
    }

    Object.keys(admisionesData).forEach(user => {
      const userData = admisionesData[user];
      const circularSeries = [userData.cantidad_admisiones];
      const circularLabels = [user];

      const circularOptions = {
        series: circularSeries,
        chart: {
          height: 390,
          type: 'radialBar',
        },
        plotOptions: {
          radialBar: {
            offsetY: 0,
            startAngle: 0,
            endAngle: 270,
            hollow: {
              margin: 5,
              size: '30%',
              background: 'transparent',
            },
            dataLabels: {
              name: {
                show: true,
              },
              value: {
                show: true,
              }
            },
          }
        },
        labels: circularLabels,
        colors: ['#1ab7ea'],
      };

      const circularChartId = `circularChart-${user}`;
      const circularChartContainer = document.querySelector(`#${circularChartId}`);
      if (circularChartContainer) {
        const circularChart = new ApexCharts(circularChartContainer, circularOptions);
        circularChart.render();
      }

      const barSeries = [{
        name: user,
        data: Object.values(userData.entidad_count || {})
      }];
      const barCategories = Object.keys(userData.entidad_count || {});

      const barOptions = {
        series: barSeries,
        chart: {
          height: 350,
          type: 'bar',
        },
        plotOptions: {
          bar: {
            borderRadius: 10,
            dataLabels: {
              position: 'top',
            },
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function(val) {
            return typeof val === 'number' ? val.toFixed(0) : val;
          },
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: ["#304758"]
          }
        },
        xaxis: {
          categories: barCategories,
          position: 'top',
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
          crosshairs: {
            fill: {
              type: 'gradient',
              gradient: {
                colorFrom: '#D8E3F0',
                colorTo: '#BED1E6',
                stops: [0, 100],
                opacityFrom: 0.4,
                opacityTo: 0.5,
              }
            }
          },
          tooltip: {
            enabled: true,
          }
        },
      };

      const barChartId = `barChart-${user}`;
      const barChartContainer = document.querySelector(`#${barChartId}`);
      if (barChartContainer) {
        const barChart = new ApexCharts(barChartContainer, barOptions);
        barChart.render();
      }
    });
  };

  return (
    <>
    <AuditoriaCm/>
    <div
      className="myContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
    <TablaPendientesUsuario/>

      <Title title="DASHBOARD" />
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
        <FormControl
          variant="outlined"
          fullWidth
          style={{ width: "350px", backgroundColor: "white" }}>
          <InputLabel id="user-select-label">Facturador</InputLabel>
          <Select
            labelId="user-select-label"
            multiple
            value={userSeleccionado}
            onChange={(e) => setUserSeleccionado(e.target.value as number[])}
            label="Usuario">
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          startIcon={<FilterAltIcon />}
          variant="outlined"
          onClick={handleFilterClick}
          style={{ width: "150px" }}>
          Filtrar
        </Button>
      </div>

      {/* Contenedores dinámicos para los gráficos */}
      {chartsRendered && Object.keys(admisiones_facturador).map(user => (
        <div key={user} style={{ marginBottom: '40px' }}>
          <h3>Gráficos para {user}</h3>
          <div id={`circularChart-${user}`} style={{ width: '400px', margin: '0 auto' }}></div>
          <div id={`barChart-${user}`} style={{ width: '400px', margin: '0 auto' }}></div>
        </div>
      ))}
    </div>

    </>
  );
};