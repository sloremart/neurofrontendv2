import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { getToken } from "../../../config/token.jsx";
import CONFIG from '../../../config/api';
import Seccion from "./Seccion.tsx";

const API = `${CONFIG.API_ENDPOINT}/gestion-facturacion`;

interface Responsable {
  responsable: string;
  total: number;
  admisiones: number;
  por_tipo: Record<string, number>;
  coordinacion_medica: boolean;
}
interface Tipo { tipo: string; total: number; }
interface Resumen { total: number; admisiones: number; responsables: Responsable[]; tipos: Tipo[]; }

// Tipos de hallazgo en ORDEN FIJO: el color sigue al tipo (nunca al puesto que ocupa), igual en las dos
// gráficas. Paleta categórica de referencia (validada para daltonismo en este orden de vecinos).
const TIPOS: { key: string; label: string; corto: string; color: string }[] = [
  { key: "INFORMACION",  label: "Información (datos del paciente / documento)", corto: "Información",  color: "#2a78d6" },
  { key: "REPORTE",      label: "Reporte (resultado)",                          corto: "Reporte",      color: "#eb6834" },
  { key: "AUTORIZACION", label: "Autorización",                                 corto: "Autorización", color: "#1baf7a" },
  { key: "SOPORTES",     label: "Soportes",                                     corto: "Soportes",     color: "#eda100" },
  { key: "RECAUDO",      label: "Recaudo (copago / cuota)",                     corto: "Recaudo",      color: "#e87ba4" },
];
const OTRO = { key: "OTRO", label: "Otros", corto: "Otros", color: "#94a3b8" };
const tipoInfo = (k: string) => TIPOS.find(t => t.key === k) || { ...OTRO, key: k, label: k, corto: k };
const ordenTipo = (k: string) => { const i = TIPOS.findIndex(t => t.key === k); return i < 0 ? 99 : i; };

const C = {
  texto: "#0f172a",
  textoSec: "#475569",
  textoTenue: "#94a3b8",
  borde: "#e2e8f0",
  pista: "#f1f5f9",
  superficie: "#f8fafc",
};

/**
 * Resumen administrativo de los hallazgos IA sin corregir (todas las admisiones, tengan o no resultado):
 * tarjetas de totales, hallazgos de cada admisionista apilados por tipo (la coordinación médica va aparte para
 * no aplastar la escala) y distribución por tipo.
 */
export default function HallazgosPendientes({ fechaIni, fechaFin, recarga }: { fechaIni: string; fechaFin: string; recarga: number }) {
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [tabla, setTabla] = useState(false);
  // Valor de `recarga` al abrir la pestaña: solo un Buscar posterior pide recalcular en el backend
  const primeraRecarga = useRef(recarga);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    const params: Record<string, string> = {};
    if (fechaIni) params.fecha_inicio = fechaIni;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (recarga > primeraRecarga.current) params.refrescar = "1";
    axios.get(`${API}/hallazgos-pendientes/`, { headers: { Authorization: `Token ${getToken()}` }, params })
      .then(({ data }) => { if (vivo) setDatos(data); })
      .catch(() => { if (vivo) setDatos(null); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarga]);

  const tipos = [...(datos?.tipos || [])].sort((a, b) => b.total - a.total);
  const responsables = datos?.responsables || [];
  const total = datos?.total || 0;
  const coordinacion = responsables.filter(r => r.coordinacion_medica);
  const admisionistas = responsables.filter(r => !r.coordinacion_medica);
  const totalCoord = coordinacion.reduce((a, r) => a + r.total, 0);
  const totalAdm = admisionistas.reduce((a, r) => a + r.total, 0);
  // Tipos presentes, en el orden fijo de la leyenda
  const tiposPresentes = TIPOS.filter(t => tipos.some(x => x.tipo === t.key))
    .concat(tipos.filter(x => ordenTipo(x.tipo) === 99).map(x => tipoInfo(x.tipo)));

  const resumen = cargando ? "Cargando…" : total === 0 ? "Sin hallazgos pendientes" : (
    <><b style={{ color: C.texto }}>{total}</b> hallazgos en <b style={{ color: C.texto }}>{datos?.admisiones || 0}</b> admisiones</>
  );

  return (
    <Seccion
      id="hallazgos-ia"
      abiertaPorDefecto
      titulo="Hallazgos IA pendientes por corregir"
      resumen={resumen}
      acciones={total > 0 ? (
        <button onClick={() => setTabla(t => !t)} style={btnLink}>{tabla ? "Ver gráficas" : "Ver como tabla"}</button>
      ) : undefined}
    >
      {total === 0 ? (
        <div style={{ fontSize: 13, color: C.textoTenue }}>
          {cargando ? "Cargando…" : "No hay hallazgos pendientes en el rango."}
        </div>
      ) : (
        <>
          {/* Tarjetas de totales */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            <Tarjeta titulo="Hallazgos pendientes" valor={total} nota={`en ${datos?.admisiones || 0} admisiones`} />
            <Tarjeta titulo="Admisionistas" valor={totalAdm}
              nota={`${pct(totalAdm, total)} del total · ${admisionistas.length} personas`} />
            <Tarjeta titulo="Coordinación médica" valor={totalCoord}
              nota={`${pct(totalCoord, total)} del total · hallazgos del resultado`}
              detalle={coordinacion.map(r => `${r.responsable}: ${r.total}`)} />
            <Tarjeta titulo="Tipo más frecuente" valor={tipos[0] ? tipoInfo(tipos[0].tipo).corto : "—"}
              nota={tipos[0] ? `${tipos[0].total} hallazgos · ${pct(tipos[0].total, total)}` : ""} texto />
          </div>

          {tabla ? (
            <TablaResumen responsables={responsables} tipos={tiposPresentes} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
              <Panel titulo="Admisionistas" subtitulo="Hallazgos pendientes de cada persona, por tipo">
                <Leyenda tipos={tiposPresentes} />
                <BarrasApiladas filas={admisionistas} tipos={tiposPresentes} />
              </Panel>
              <Panel titulo="Por tipo de hallazgo" subtitulo="Qué se está corrigiendo (admisionistas y coordinación)">
                <BarrasTipo tipos={tipos} total={total} responsables={responsables} />
              </Panel>
            </div>
          )}
        </>
      )}
    </Seccion>
  );
}

const pct = (n: number, t: number) => `${Math.round((n / Math.max(1, t)) * 100)} %`;

function Tarjeta({ titulo, valor, nota, detalle = [], texto = false }:
  { titulo: string; valor: number | string; nota: string; detalle?: string[]; texto?: boolean }) {
  return (
    <div style={{ background: C.superficie, border: `1px solid ${C.borde}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textoSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>{titulo}</div>
      <div style={{ fontSize: texto ? 20 : 26, fontWeight: 800, color: C.texto, lineHeight: 1.2, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      <div style={{ fontSize: 11, color: C.textoSec, marginTop: 2 }}>{nota}</div>
      {detalle.length > 0 && (
        <div style={{ fontSize: 11, color: C.textoTenue, marginTop: 4 }}>{detalle.join(" · ")}</div>
      )}
    </div>
  );
}

function Panel({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C.borde}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.texto }}>{titulo}</div>
      <div style={{ fontSize: 11, color: C.textoTenue, marginBottom: 12 }}>{subtitulo}</div>
      {children}
    </div>
  );
}

function Leyenda({ tipos }: { tipos: { key: string; corto: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: 12 }}>
      {tipos.map(t => (
        <span key={t.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textoSec }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
          {t.corto}
        </span>
      ))}
    </div>
  );
}

/** Una barra por admisionista, segmentada por tipo (orden fijo), con el total al final. */
function BarrasApiladas({ filas, tipos }: { filas: Responsable[]; tipos: { key: string; label: string; color: string }[] }) {
  const [hover, setHover] = useState<{ fila: string; tipo: string } | null>(null);
  const max = Math.max(1, ...filas.map(f => f.total));
  if (filas.length === 0) return <div style={{ fontSize: 12, color: C.textoTenue }}>Sin hallazgos de admisionistas.</div>;
  return (
    <div role="list">
      {filas.map(f => (
        <div key={f.responsable} role="listitem" aria-label={`${f.responsable}: ${f.total} hallazgos`}
          style={{ display: "grid", gridTemplateColumns: "minmax(130px, 36%) 1fr 40px", alignItems: "center", gap: 10, padding: "6px 0", position: "relative" }}>
          <div title={f.responsable} style={{ fontSize: 12, color: C.texto, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {f.responsable}
          </div>
          <div style={{ display: "flex", gap: 2, height: 12, width: `${Math.max(2, (f.total / max) * 100)}%` }}>
            {tipos.filter(t => f.por_tipo[t.key]).map((t, i, arr) => {
              const n = f.por_tipo[t.key];
              const activo = hover?.fila === f.responsable && hover?.tipo === t.key;
              return (
                <div key={t.key}
                  onMouseEnter={() => setHover({ fila: f.responsable, tipo: t.key })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    flex: `${n} 0 0`, minWidth: 3, background: t.color, cursor: "default",
                    opacity: hover && hover.fila === f.responsable && !activo ? 0.55 : 1,
                    borderRadius: `${i === 0 ? 4 : 0}px ${i === arr.length - 1 ? 4 : 0}px ${i === arr.length - 1 ? 4 : 0}px ${i === 0 ? 4 : 0}px`,
                    position: "relative",
                  }}>
                  {activo && (
                    <Tooltip>
                      <b>{f.responsable}</b><br />{t.label}: {n} de {f.total}
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.texto, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{f.total}</div>
        </div>
      ))}
    </div>
  );
}

/** Barras horizontales ordenadas por tipo, con su color de identidad, cantidad y porcentaje. */
function BarrasTipo({ tipos, total, responsables }: { tipos: Tipo[]; total: number; responsables: Responsable[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...tipos.map(t => t.total));
  return (
    <div role="list">
      {tipos.map(t => {
        const info = tipoInfo(t.tipo);
        const top = responsables.filter(r => r.por_tipo[t.tipo])
          .sort((a, b) => (b.por_tipo[t.tipo] || 0) - (a.por_tipo[t.tipo] || 0)).slice(0, 4);
        return (
          <div key={t.tipo} role="listitem" aria-label={`${info.label}: ${t.total}`}
            onMouseEnter={() => setHover(t.tipo)} onMouseLeave={() => setHover(null)}
            style={{ padding: "7px 0", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.texto, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: info.color, flex: "none" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.label}</span>
              </span>
              <span style={{ fontSize: 12, color: C.textoSec, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                <b style={{ color: C.texto }}>{t.total}</b> · {pct(t.total, total)}
              </span>
            </div>
            <div style={{ height: 8, background: C.pista, borderRadius: 4 }}>
              <div style={{ width: `${Math.max(1.5, (t.total / max) * 100)}%`, height: "100%", background: info.color, borderRadius: 4,
                opacity: hover && hover !== t.tipo ? 0.55 : 1 }} />
            </div>
            {hover === t.tipo && top.length > 0 && (
              <Tooltip>
                <b>{info.label}</b>
                {top.map(r => <div key={r.responsable}>{r.responsable}: {r.por_tipo[t.tipo]}</div>)}
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 10, pointerEvents: "none",
      background: "#0f172a", color: "#f8fafc", borderRadius: 6, padding: "8px 10px", fontSize: 11, lineHeight: 1.5,
      boxShadow: "0 6px 16px rgba(15,23,42,0.22)", whiteSpace: "nowrap",
    }}>
      {children}
    </div>
  );
}

/** Vista de tabla (accesible y para copiar): responsable × tipo. */
function TablaResumen({ responsables, tipos }: { responsables: Responsable[]; tipos: { key: string; corto: string }[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
        <thead>
          <tr>
            <th style={th}>Responsable</th>
            {tipos.map(t => <th key={t.key} style={{ ...th, textAlign: "right" }}>{t.corto}</th>)}
            <th style={{ ...th, textAlign: "right" }}>Total</th>
            <th style={{ ...th, textAlign: "right" }}>Admisiones</th>
          </tr>
        </thead>
        <tbody>
          {responsables.map(r => (
            <tr key={r.responsable}>
              <td style={tdT}>{r.responsable}{r.coordinacion_medica ? " (coord. médica)" : ""}</td>
              {tipos.map(t => <td key={t.key} style={{ ...tdT, textAlign: "right" }}>{r.por_tipo[t.key] || ""}</td>)}
              <td style={{ ...tdT, textAlign: "right", fontWeight: 700 }}>{r.total}</td>
              <td style={{ ...tdT, textAlign: "right" }}>{r.admisiones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", borderBottom: `2px solid ${C.borde}`, color: C.textoSec, textAlign: "left", fontWeight: 700, whiteSpace: "nowrap" };
const tdT: React.CSSProperties = { padding: "6px 8px", borderBottom: `1px solid ${C.borde}`, color: C.texto, fontVariantNumeric: "tabular-nums" };
const btnLink: React.CSSProperties = { background: "none", border: "none", color: "#4f46e5", fontWeight: 600, fontSize: 12, cursor: "pointer", padding: 4 };
