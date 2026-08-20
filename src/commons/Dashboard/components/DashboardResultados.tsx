import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'react-apexcharts';
import { AppDispatch, RootState } from '../../../store/store';
import { get_resultados_estudios } from '../store/thunks/DashboardThunks.tsx';

const MESES_OPCIONES = [1, 3, 6, 12];

const fmtNum = (n: number) => new Intl.NumberFormat('es-CO').format(n);

const pct = (a: number, b: number) =>
  b === 0 ? '0%' : `${Math.round((a / b) * 100)}%`;

const DashboardResultados: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { resultadosEstudios, loading } = useSelector((s: RootState) => s.dashboard);

  const [meses, setMeses] = useState(3);

  useEffect(() => {
    dispatch(get_resultados_estudios(meses));
  }, [dispatch, meses]);

  const d = resultadosEstudios;

  // Gráfica de líneas: entregados vs realizados por mes
  const timelineSeries = d
    ? [
        { name: 'Con resultado', data: d.timeline.map((t) => t.entregados) },
        { name: 'Realizados', data: d.timeline.map((t) => t.realizados) },
      ]
    : [];

  const timelineOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
    colors: ['#6C3FC5', '#0d9488'],
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
    xaxis: {
      categories: d?.timeline.map((t) => t.mes) ?? [],
      labels: { style: { colors: '#94a3b8', fontSize: '12px' } },
    },
    yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (v) => fmtNum(v) } },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    tooltip: { theme: 'dark', y: { formatter: (v) => `${fmtNum(v)} estudios` } },
    grid: { borderColor: '#334155' },
  };

  // Gráfica de barras: por tipo de examen
  const tipoSeries = d ? [{ name: 'Estudios', data: d.por_tipo_examen.map((t) => t.cantidad) }] : [];
  const tipoOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
    colors: ['#2563eb'],
    xaxis: {
      categories: d?.por_tipo_examen.map((t) => t.tipo) ?? [],
      labels: { style: { colors: '#94a3b8', fontSize: '11px' }, rotate: -30 },
    },
    yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (v) => fmtNum(v) } },
    plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        if (!d) return '';
        const t = d.por_tipo_examen[dataPointIndex];
        return `<div style="padding:8px 12px;background:#1e293b;color:#e2e8f0;border-radius:6px;font-size:13px">
          <strong>${t.tipo}</strong><br/>
          ${fmtNum(t.cantidad)} estudios<br/>
          ${t.dias_promedio.toFixed(1)} días prom.
        </div>`;
      },
    },
    grid: { borderColor: '#334155' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #381A73, #1e3a8a, #0f766e)',
        padding: '28px 32px',
        marginBottom: '32px',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Resultados de Estudios
        </h1>
        <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '0.9rem' }}>
          Entrega de resultados vs estudios realizados · SIESA
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Filtro período */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 8 }}>
            Período
          </span>
          {MESES_OPCIONES.map((m) => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: meses === m ? '#6C3FC5' : '#1e293b',
                color: meses === m ? '#fff' : '#94a3b8',
                transition: 'background 0.15s',
              }}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* KPI cards */}
        {d && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '20px 24px', borderLeft: '4px solid #6C3FC5' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total resultados
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmtNum(d.total_resultados)}
              </p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '20px 24px', borderLeft: '4px solid #4ade80' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Con resultado entregado
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#4ade80' }}>
                {pct(d.admisiones_con_resultado, d.total_resultados)}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {fmtNum(d.admisiones_con_resultado)} estudios
              </p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '20px 24px', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pendientes (últ. 30 días)
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#f59e0b' }}>
                {fmtNum(d.pendientes_30d_total)}
              </p>
            </div>
          </div>
        )}

        {/* Gráfica: timeline */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
            Evolución mensual
          </h2>
          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Cargando...
            </div>
          ) : timelineSeries.length > 0 && d!.timeline.length > 0 ? (
            <Chart options={timelineOptions} series={timelineSeries} type="area" height={280} />
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Sin datos para el período seleccionado
            </div>
          )}
        </div>

        {/* Fila: tipo examen + pendientes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Por tipo de examen */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Por tipo de examen
            </h2>
            {d && d.por_tipo_examen.length > 0 ? (
              <Chart options={tipoOptions} series={tipoSeries} type="bar" height={260} />
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Sin datos
              </div>
            )}
          </div>

          {/* Estudios pendientes */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px', overflowY: 'auto', maxHeight: 340 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
              Pendientes últimos 30 días
            </h2>
            {d && d.pendientes_30d.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    {['Estudio', 'Fecha', 'Servicio', 'Entidad'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '6px 10px',
                          color: '#64748b',
                          fontWeight: 600,
                          borderBottom: '1px solid #334155',
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          position: 'sticky',
                          top: 0,
                          background: '#1e293b',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.pendientes_30d.map((p, i) => (
                    <tr key={p.estudio} style={{ background: i % 2 === 0 ? 'transparent' : '#0f172a' }}>
                      <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', color: '#93c5fd', fontWeight: 600 }}>
                        {p.estudio}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{p.fecha}</td>
                      <td style={{ padding: '7px 10px', color: '#e2e8f0' }}>{p.servicio}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{p.entidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64748b' }}>
                No hay estudios pendientes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardResultados;
