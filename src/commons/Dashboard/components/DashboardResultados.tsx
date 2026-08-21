import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-apexcharts';
import { Button } from '@mui/material';
import { AppDispatch, RootState } from '../../../store/store';
import { get_resultados_estudios } from '../store/thunks/DashboardThunks.tsx';
import { Title } from '../../../components/Title.tsx';

const CHART_COLORS = ['#7e22ce', '#6d28d9', '#4f46e5', '#1d4ed8', '#0e7490', '#155e75', '#334155', '#3b0764', '#0f172a', '#083344'];

const fmtNum = (n: number) => new Intl.NumberFormat('es-CO').format(n);
const pct = (a: number, b: number) => (b === 0 ? '0%' : `${Math.round((a / b) * 100)}%`);

const DashboardResultados: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { resultadosEstudios, loading, error } = useSelector((s: RootState) => s.dashboard);

  const [meses, setMeses] = useState(3);

  useEffect(() => {
    dispatch(get_resultados_estudios(meses));
  }, [dispatch, meses]);

  const d = resultadosEstudios;

  const timelineOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 800 } },
    colors: ['#7e22ce', '#0e7490'],
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: d?.timeline.map((t) => t.mes) ?? [], labels: { style: { fontSize: '12px' } } },
    yaxis: { labels: { formatter: (v) => fmtNum(v) } },
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `${fmtNum(v)} estudios` } },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
  };

  const tipoOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 800 } },
    colors: CHART_COLORS,
    xaxis: {
      categories: d?.por_tipo_examen.map((t) => t.tipo) ?? [],
      labels: { style: { fontSize: '11px' }, rotate: -30 },
    },
    yaxis: { labels: { formatter: (v) => fmtNum(v) } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', distributed: true } },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        if (!d) return '';
        const t = d.por_tipo_examen[dataPointIndex];
        return `<div style="padding:8px 12px;font-size:13px"><strong>${t.tipo}</strong><br/>${fmtNum(t.cantidad)} estudios<br/>${t.dias_promedio.toFixed(1)} días prom.</div>`;
      },
    },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
        📋 Dashboard Resultados
      </h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>Período:</span>
        {[1, 3, 6, 12].map((m) => (
          <Button
            key={m}
            variant={meses === m ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            onClick={() => setMeses(m)}
          >
            {m} {m === 1 ? 'mes' : 'meses'}
          </Button>
        ))}
      </div>

      {loading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {d && !loading && (
        <div style={{ width: '100%', maxWidth: '1400px' }}>
          {/* Tarjetas resumen */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
            <div style={{ backgroundColor: '#3c0b79', color: 'white', padding: '15px 30px', borderRadius: 12 }}>
              <strong>Total resultados</strong><br />
              <span style={{ fontSize: '24px', fontWeight: 700 }}>{fmtNum(d.total_resultados)}</span>
            </div>
            <div style={{ backgroundColor: '#de497a', color: 'white', padding: '15px 30px', borderRadius: 12 }}>
              <strong>Con resultado entregado</strong><br />
              <span style={{ fontSize: '24px', fontWeight: 700 }}>{pct(d.admisiones_con_resultado, d.total_resultados)}</span>
              <br /><span style={{ fontSize: '13px' }}>{fmtNum(d.admisiones_con_resultado)} estudios</span>
            </div>
            <div style={{ backgroundColor: '#4A90E2', color: 'white', padding: '15px 30px', borderRadius: 12 }}>
              <strong>Pendientes (últ. 30 días)</strong><br />
              <span style={{ fontSize: '24px', fontWeight: 700 }}>{fmtNum(d.pendientes_30d_total)}</span>
            </div>
          </div>

          {/* Gráficas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            {/* Timeline */}
            <div style={{ flex: '1 1 600px', maxWidth: '900px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
              <Title title="EVOLUCIÓN MENSUAL: CON RESULTADO VS REALIZADOS" />
              {d.timeline.length > 0 ? (
                <Chart
                  options={timelineOptions}
                  series={[
                    { name: 'Con resultado', data: d.timeline.map((t) => t.entregados) },
                    { name: 'Realizados', data: d.timeline.map((t) => t.realizados) },
                  ]}
                  type="area"
                  height={320}
                />
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>Sin datos para el período seleccionado</p>
              )}
            </div>

            {/* Por tipo de examen */}
            <div style={{ flex: '1 1 400px', maxWidth: '600px', backgroundColor: '#fff', padding: 24, borderRadius: 12 }}>
              <Title title="POR TIPO DE EXAMEN" />
              {d.por_tipo_examen.length > 0 ? (
                <Chart
                  options={tipoOptions}
                  series={[{ name: 'Estudios', data: d.por_tipo_examen.map((t) => t.cantidad) }]}
                  type="bar"
                  height={320}
                />
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>Sin datos</p>
              )}
            </div>
          </div>

          {/* Tabla pendientes */}
          {d.pendientes_30d.length > 0 && (
            <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, marginTop: '20px', overflowX: 'auto' }}>
              <Title title="ESTUDIOS SIN RESULTADO — ÚLTIMOS 30 DÍAS" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginTop: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    {['Estudio', 'Fecha', 'Servicio', 'Entidad'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: '#374151', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.pendientes_30d.map((p, i) => (
                    <tr key={p.estudio} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#4f46e5' }}>{p.estudio}</td>
                      <td style={{ padding: '10px 16px', color: '#6b7280' }}>{p.fecha}</td>
                      <td style={{ padding: '10px 16px' }}>{p.servicio}</td>
                      <td style={{ padding: '10px 16px', color: '#6b7280' }}>{p.entidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardResultados;
