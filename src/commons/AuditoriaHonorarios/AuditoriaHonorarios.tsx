import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { getToken } from "../../config/token.jsx";
import CONFIG from "../../config/api";

const API = `${CONFIG.API_ENDPOINT}/gestion-facturacion/auditoria`;
const auth = () => ({ headers: { Authorization: `Token ${getToken()}` } });

type Vista = "medicos" | "lumier" | "tarifas";

interface MedicoResumen {
  cod_medico: number; medico: string; especialidad: string; lineas: number; honorario: number;
  facturado: number; pendientes: number; ok: number; glosas: number; con_alertas: number;
  sin_tarifa: number; hallazgos_lumier: number; cerrada: boolean; cerrada_por: string;
}
interface Resumen {
  periodo: string; medicos: MedicoResumen[]; total_honorarios: number;
  lumier: { cargado: boolean; estudios: number; hallazgos: number; pendientes: number };
}
interface Linea {
  sis_deta_id: number; estudio: number; fecha: string | null; paciente: string; tipo_id: string;
  documento: string; cups: string; descripcion: string; cantidad: number; contrato: string; grupo: string;
  factura: string; valor_facturado: number; tarifa: string; honorario_calculado: number;
  valor_ajustado: number | null; honorario: number; estado: "PENDIENTE" | "OK" | "GLOSA";
  observacion: string; auditado_por: string; alertas: string[]; sin_tarifa: boolean;
  lumier: { profesional: string; cups: string; examen: string } | null;
}
interface Detalle {
  periodo: string; cod_medico: number; medico: string; especialidad: string; cerrada: boolean;
  cerrada_por: string; lineas: Linea[]; tiene_formato_fisiatria: boolean;
}
interface Hallazgo {
  clave: string; tipo: string; fecha: string | null; paciente: string; documento: string; cups: string;
  examen: string; medico_zeus: string; medico_lumier: string; cups_lumier?: string; examen_lumier?: string;
  cod_medico_zeus: number | null; cod_medico_lumier: number | null; medico_lumier_zeus: string;
  estudio: number | null; decision: string; nota: string; validado_por: string;
}
interface Tarifa {
  id: number; area: string; encabezado: string; cod_medico: number | null; medico: string; cups: string;
  descripcion: string; grupo: string; tipo: string; valor: number | null; porcentaje: number | null;
  max_puntos: number | null; escalas: string; por_unidad: boolean; solo_contrato: string;
  texto_original: string; activo: boolean; texto: string;
}
interface MedicoZeus { codigo: number; nombre: string; especialidad: string; }

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("es-CO");
const fecha = (f: string | null) => (f ? f.split("-").reverse().join("/") : "—");
const mesAnterior = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const nombreMes = (p: string) => {
  const [a, m] = p.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
};
const errorDe = (e: any, defecto: string) => e?.response?.data?.error || defecto;

const TIPO_HALLAZGO: Record<string, { texto: string; color: [string, string] }> = {
  MEDICO_DIFERENTE: { texto: "Médico diferente", color: ["#fee2e2", "#991b1b"] },
  CUPS_DIFERENTE:   { texto: "Examen diferente", color: ["#ffedd5", "#9a3412"] },
  SOLO_LUMIER:      { texto: "Solo en Lumier",   color: ["#e0e7ff", "#3730a3"] },
  SOLO_ZEUS:        { texto: "No está en Lumier", color: ["#f1f5f9", "#475569"] },
};
const DECISION_TEXTO: Record<string, string> = {
  ZEUS: "Se paga al médico de Zeus", LUMIER: "Se paga al médico de Lumier",
  REVISADO: "Revisado", DESCARTADO: "Descartado",
};
const ESTADO_COLOR: Record<string, [string, string]> = {
  PENDIENTE: ["#f1f5f9", "#475569"], OK: ["#dcfce7", "#166534"], GLOSA: ["#fee2e2", "#991b1b"],
};
const GRUPO_TEXTO: Record<string, string> = {
  SANITAS: "Sanitas", ENTIDADES: "Entidades", PARTICULAR: "Particular", TODOS: "Todas",
};
const TIPO_TARIFA: Record<string, string> = {
  FIJO: "Valor fijo", PORCENTAJE: "% del valor facturado", POR_PUNTO: "Por punto", ESCALONADO: "Escalonado",
};

export function AuditoriaHonorarios() {
  const [vista, setVista] = useState<Vista>("medicos");
  const [periodo, setPeriodo] = useState(mesAnterior());
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [medicoSel, setMedicoSel] = useState<number | null>(null);
  const [medicoLumier, setMedicoLumier] = useState<string>("Todos");
  const lumierInput = useRef<HTMLInputElement>(null);

  const cargarResumen = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const { data } = await axios.get(`${API}/resumen/`, { ...auth(), params: { periodo } });
      setResumen(data);
    } catch (e) {
      setError(errorDe(e, "No se pudo cargar la auditoría"));
    } finally {
      setCargando(false);
    }
  }, [periodo]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  const subirLumier = async (archivo: File) => {
    const form = new FormData(); form.append("archivo", archivo);
    setCargando(true); setError(""); setAviso("");
    try {
      const { data } = await axios.post(`${API}/lumier/cargar/`, form, auth());
      const periodos = Object.entries(data.periodos).map(([p, n]) => `${nombreMes(p)}: ${n}`).join(" · ");
      setAviso(`Lumier cargado: ${data.estudios} estudios (${periodos}).` +
        (data.profesionales_sin_asociar?.length ? ` Sin asociar a un médico de Zeus: ${data.profesionales_sin_asociar.join(", ")}.` : ""));
      await cargarResumen();
    } catch (e) {
      setError(errorDe(e, "No se pudo cargar el archivo de Lumier"));
    } finally {
      setCargando(false);
      if (lumierInput.current) lumierInput.current.value = "";
    }
  };

  return (
    <div style={{ fontFamily: "inherit", maxWidth: 1500, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #1e2d5a 0%, #2d1b69 100%)", padding: "18px 24px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Auditoría de honorarios médicos
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: "4px 0 0", fontSize: 13 }}>
          Mes vencido · servicios de Zeus con la tarifa de cada médico · formato COM-F-002-V1
        </p>
      </div>

      <div style={{ display: "flex", gap: 0, background: "#fff", borderBottom: "1px solid #e2e8f0", paddingLeft: 16, flexWrap: "wrap" }}>
        {([
          ["medicos", "Médicos del mes"],
          ["lumier", `Hallazgos Lumier${resumen?.lumier.pendientes ? ` (${resumen.lumier.pendientes})` : ""}`],
          ["tarifas", "Tarifas"],
        ] as [Vista, string][]).map(([k, label]) => (
          <button key={k} onClick={() => { setVista(k); setMedicoSel(null); setMedicoLumier("Todos"); }} style={{
            padding: "12px 20px", border: "none", cursor: "pointer", background: "transparent", fontWeight: 600, fontSize: 14,
            color: vista === k ? "#6d28d9" : "#64748b",
            borderBottom: vista === k ? "3px solid #6d28d9" : "3px solid transparent", marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>
        {vista !== "tarifas" && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
            <Filtro etiqueta="Mes auditado">
              <input type="month" value={periodo} onChange={e => { setPeriodo(e.target.value); setMedicoSel(null); }} style={inputStyle} />
            </Filtro>
            <div style={{ flex: 1 }} />
            <input ref={lumierInput} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && subirLumier(e.target.files[0])} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
              <button onClick={() => lumierInput.current?.click()} style={btnStyle("#0f766e")} disabled={cargando}>
                Cargar informe de Lumier
              </button>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {resumen?.lumier.cargado ? `Lumier de ${nombreMes(periodo)}: ${resumen.lumier.estudios} estudios` : `Sin Lumier para ${nombreMes(periodo)}`}
              </span>
            </div>
          </div>
        )}

        {error && <Mensaje color="#991b1b" fondo="#fee2e2" texto={error} onCerrar={() => setError("")} />}
        {aviso && <Mensaje color="#166534" fondo="#dcfce7" texto={aviso} onCerrar={() => setAviso("")} />}

        {vista === "medicos" && medicoSel === null && (
          <TablaMedicos resumen={resumen} cargando={cargando} periodo={periodo}
            onAbrir={setMedicoSel} onVerLumier={() => setVista("lumier")} />
        )}
        {vista === "medicos" && medicoSel !== null && (
          <DetalleMedico periodo={periodo} codMedico={medicoSel}
            onVolver={() => { setMedicoSel(null); cargarResumen(); }}
            onVerLumier={() => { setMedicoLumier(String(medicoSel)); setMedicoSel(null); setVista("lumier"); }} />
        )}
        {vista === "lumier" && <HallazgosLumier periodo={periodo} onCambio={cargarResumen}
          medicoInicial={medicoLumier} />}
        {vista === "tarifas" && <Tarifas />}
      </div>
    </div>
  );
}

export default AuditoriaHonorarios;

// ── Médicos del mes ─────────────────────────────────────────────────────────

function TablaMedicos({ resumen, cargando, periodo, onAbrir, onVerLumier }: {
  resumen: Resumen | null; cargando: boolean; periodo: string;
  onAbrir: (cod: number) => void; onVerLumier: () => void;
}) {
  const [buscar, setBuscar] = useState("");
  if (cargando && !resumen) return <Cargando />;
  if (!resumen) return null;
  const medicos = resumen.medicos.filter(m =>
    !buscar || `${m.medico} ${m.especialidad}`.toLowerCase().includes(buscar.toLowerCase()));
  const pendientes = resumen.medicos.reduce((s, m) => s + m.pendientes, 0);
  const cerradas = resumen.medicos.filter(m => m.cerrada).length;
  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Kpi valor={fmt(resumen.total_honorarios)} texto={`Honorarios de ${nombreMes(periodo)}`} fondo="#ede9fe" color="#5b21b6" />
        <Kpi valor={`${cerradas} / ${resumen.medicos.length}`} texto="Auditorías cerradas" fondo="#dcfce7" color="#166534" />
        <Kpi valor={pendientes.toLocaleString("es-CO")} texto="Líneas por auditar" fondo="#fef3c7" color="#92400e" />
        <div onClick={onVerLumier} style={{ cursor: "pointer" }}>
          <Kpi valor={resumen.lumier.cargado ? String(resumen.lumier.pendientes) : "—"}
            texto={resumen.lumier.cargado ? "Hallazgos Lumier por validar" : "Lumier sin cargar"} fondo="#fee2e2" color="#991b1b" />
        </div>
        <div style={{ flex: 1 }} />
        <Filtro etiqueta="Buscar médico">
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre o especialidad" style={inputStyle} />
        </Filtro>
      </div>
      <div style={tablaWrap}>
        <table style={tabla}>
          <thead>
            <tr style={thRow}>
              {["Médico", "Líneas", "Honorario", "Avance", "Alertas", "Sin tarifa", "Lumier", "Estado", ""].map(t => <th key={t} style={th}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {medicos.map(m => {
              const avance = m.lineas ? Math.round(((m.ok + m.glosas) / m.lineas) * 100) : 0;
              return (
                <tr key={m.cod_medico} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }} onClick={() => onAbrir(m.cod_medico)}>
                  <td style={td}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{m.medico}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{m.especialidad}</div>
                  </td>
                  <td style={tdNum}>{m.lineas}</td>
                  <td style={{ ...tdNum, fontWeight: 700 }}>{fmt(m.honorario)}</td>
                  <td style={td}>
                    <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, width: 110 }}>
                      <div style={{ background: avance === 100 ? "#16a34a" : "#7c3aed", width: `${avance}%`, height: 6, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                      {m.ok} OK · {m.glosas} glosas · {m.pendientes} pendientes
                    </div>
                  </td>
                  <td style={tdNum}>{m.con_alertas ? <Chip texto={String(m.con_alertas)} color={["#fef3c7", "#92400e"]} /> : "—"}</td>
                  <td style={tdNum}>{m.sin_tarifa ? <Chip texto={String(m.sin_tarifa)} color={["#fee2e2", "#991b1b"]} /> : "—"}</td>
                  <td style={tdNum}>{m.hallazgos_lumier ? <Chip texto={String(m.hallazgos_lumier)} color={["#fee2e2", "#991b1b"]} /> : "—"}</td>
                  <td style={td}>
                    {m.cerrada
                      ? <Chip texto={`Cerrada${m.cerrada_por ? ` · ${m.cerrada_por}` : ""}`} color={["#dcfce7", "#166534"]} />
                      : <Chip texto="En curso" color={["#f1f5f9", "#475569"]} />}
                  </td>
                  <td style={td}><button style={btnSmall("#6d28d9")}>Auditar</button></td>
                </tr>
              );
            })}
            {!medicos.length && <tr><td colSpan={9} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>Sin servicios en este mes</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Detalle de un médico ────────────────────────────────────────────────────

function DetalleMedico({ periodo, codMedico, onVolver, onVerLumier }: {
  periodo: string; codMedico: number; onVolver: () => void; onVerLumier: () => void;
}) {
  const [det, setDet] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [estadoF, setEstadoF] = useState("Todos");
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [editando, setEditando] = useState<Linea | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const { data } = await axios.get(`${API}/medico/${codMedico}/`, { ...auth(), params: { periodo } });
      setDet(data); setSel(new Set());
    } catch (e) {
      setError(errorDe(e, "No se pudieron cargar las líneas"));
    } finally {
      setCargando(false);
    }
  }, [periodo, codMedico]);
  useEffect(() => { cargar(); }, [cargar]);

  const lineas = useMemo(() => (det?.lineas || []).filter(l =>
    (estadoF === "Todos" || l.estado === estadoF) &&
    (!soloAlertas || l.alertas.length > 0) &&
    (!buscar || `${l.paciente} ${l.documento} ${l.cups} ${l.descripcion} ${l.contrato} ${l.estudio}`.toLowerCase().includes(buscar.toLowerCase()))
  ), [det, estadoF, soloAlertas, buscar]);

  const guardar = async (ids: number[], cambios: Record<string, any>) => {
    try {
      await axios.post(`${API}/linea/`, { periodo, cod_medico: codMedico, ids, ...cambios }, auth());
      await cargar();
      return true;
    } catch (e) {
      setError(errorDe(e, "No se pudo guardar"));
      return false;
    }
  };

  const cerrar = async (reabrir: boolean) => {
    if (!reabrir && !window.confirm("¿Cerrar la auditoría de este médico? Ya no se podrá editar hasta reabrirla.")) return;
    try {
      await axios.post(`${API}/cerrar/`, { periodo, cod_medico: codMedico, reabrir }, auth());
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo cerrar"));
    }
  };

  const exportar = async (formato: string) => {
    try {
      const resp = await axios.get(`${API}/exportar/`, {
        ...auth(), params: { periodo, cod_medico: codMedico, formato }, responseType: "blob",
      });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Honorarios_${(det?.medico || "medico").replace(/\s+/g, "_")}_${periodo}${formato === "fisiatria" ? "_fisiatria" : ""}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo generar el Excel");
    }
  };

  if (!det) return cargando ? <Cargando /> : (error ? <Mensaje color="#991b1b" fondo="#fee2e2" texto={error} /> : null);

  const total = det.lineas.reduce((s, l) => s + l.honorario, 0);
  const pend = det.lineas.filter(l => l.estado === "PENDIENTE").length;
  const glosado = det.lineas.filter(l => l.estado === "GLOSA").reduce((s, l) => s + l.honorario_calculado, 0);
  const todosSel = lineas.length > 0 && lineas.every(l => sel.has(l.sis_deta_id));
  const bloqueada = det.cerrada;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={onVolver} style={btnStyle("#64748b")}>← Médicos</button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{det.medico}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{det.especialidad} · {nombreMes(periodo)}</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onVerLumier} style={btnStyle("#b91c1c")}>Hallazgos Lumier del médico</button>
        <button onClick={() => exportar("general")} style={btnStyle("#0f766e")}>Exportar formato</button>
        {det.tiene_formato_fisiatria && <button onClick={() => exportar("fisiatria")} style={btnStyle("#0f766e")}>Formato Fisiatría</button>}
        {bloqueada
          ? <button onClick={() => cerrar(true)} style={btnStyle("#b45309")}>Reabrir auditoría</button>
          : <button onClick={() => cerrar(false)} style={btnStyle("#16a34a")} disabled={pend > 0}
              title={pend ? `Faltan ${pend} líneas por auditar` : ""}>Cerrar auditoría</button>}
      </div>

      {error && <Mensaje color="#991b1b" fondo="#fee2e2" texto={error} onCerrar={() => setError("")} />}
      {bloqueada && <Mensaje color="#166534" fondo="#dcfce7" texto={`Auditoría cerrada${det.cerrada_por ? ` por ${det.cerrada_por}` : ""}. Reábrala para hacer cambios.`} />}

      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Kpi valor={fmt(total)} texto="Honorario a pagar" fondo="#ede9fe" color="#5b21b6" />
        <Kpi valor={String(det.lineas.length)} texto="Líneas" fondo="#f8fafc" color="#1e293b" />
        <Kpi valor={String(pend)} texto="Pendientes" fondo="#fef3c7" color="#92400e" />
        <Kpi valor={fmt(glosado)} texto="Glosado" fondo="#fee2e2" color="#991b1b" />
        <div style={{ flex: 1 }} />
        <Filtro etiqueta="Buscar">
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Paciente, documento, CUPS, estudio" style={inputStyle} />
        </Filtro>
        <Filtro etiqueta="Estado" flex="0 1 150px">
          <select value={estadoF} onChange={e => setEstadoF(e.target.value)} style={selectStyle}>
            {["Todos", "PENDIENTE", "OK", "GLOSA"].map(o => <option key={o} value={o}>{o === "Todos" ? "Todos" : o === "PENDIENTE" ? "Pendiente" : o === "OK" ? "OK" : "Glosa"}</option>)}
          </select>
        </Filtro>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", paddingBottom: 8 }}>
          <input type="checkbox" checked={soloAlertas} onChange={e => setSoloAlertas(e.target.checked)} /> Solo con alertas
        </label>
      </div>

      {!bloqueada && sel.size > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, background: "#f5f3ff", padding: "8px 12px", borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: "#5b21b6", fontWeight: 600 }}>{sel.size} seleccionadas</span>
          <button style={btnSmall("#16a34a")} onClick={() => guardar(Array.from(sel), { estado: "OK" })}>Marcar OK</button>
          <button style={btnSmall("#64748b")} onClick={() => guardar(Array.from(sel), { estado: "PENDIENTE" })}>Volver a pendiente</button>
          <button style={btnSmall("#94a3b8")} onClick={() => setSel(new Set())}>Quitar selección</button>
        </div>
      )}

      <div style={tablaWrap}>
        <table style={tabla}>
          <thead>
            <tr style={thRow}>
              <th style={th}>
                {!bloqueada && <input type="checkbox" checked={todosSel} onChange={() => {
                  const n = new Set(sel);
                  lineas.forEach(l => todosSel ? n.delete(l.sis_deta_id) : n.add(l.sis_deta_id));
                  setSel(n);
                }} />}
              </th>
              {["Fecha", "Paciente", "Servicio", "Cant.", "Contrato", "Facturado", "Tarifa", "Honorario", "Estado", ""].map(t => <th key={t} style={th}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {lineas.map(l => (
              <tr key={l.sis_deta_id} style={{ borderBottom: "1px solid #f1f5f9", background: l.estado === "GLOSA" ? "#fff7f7" : undefined }}>
                <td style={td}>
                  {!bloqueada && <input type="checkbox" checked={sel.has(l.sis_deta_id)} onChange={() => {
                    const n = new Set(sel); n.has(l.sis_deta_id) ? n.delete(l.sis_deta_id) : n.add(l.sis_deta_id); setSel(n);
                  }} />}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {fecha(l.fecha)}
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Est. {l.estudio}</div>
                </td>
                <td style={td}>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{l.paciente}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{l.tipo_id} {l.documento}</div>
                </td>
                <td style={{ ...td, maxWidth: 300 }}>
                  <div><b>{l.cups}</b> {l.descripcion}</div>
                  {l.alertas.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {l.alertas.map(a => <Chip key={a} texto={a} color={a.startsWith("Lumier") || a.startsWith("No está") ? ["#fee2e2", "#991b1b"] : ["#fef3c7", "#92400e"]} />)}
                    </div>
                  )}
                  {l.observacion && <div style={{ fontSize: 11, color: "#7c2d12", marginTop: 4 }}>📝 {l.observacion}</div>}
                </td>
                <td style={tdNum}>{l.cantidad}</td>
                <td style={td}>
                  <div style={{ fontSize: 12 }}>{l.contrato}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{GRUPO_TEXTO[l.grupo]}{l.factura ? ` · ${l.factura}` : ""}</div>
                </td>
                <td style={tdNum}>{fmt(l.valor_facturado)}</td>
                <td style={{ ...td, fontSize: 12, color: "#475569" }}>{l.tarifa || <span style={{ color: "#991b1b" }}>Sin tarifa</span>}</td>
                <td style={{ ...tdNum, fontWeight: 700 }}>
                  {fmt(l.honorario)}
                  {l.valor_ajustado != null && <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, textDecoration: "line-through" }}>{fmt(l.honorario_calculado)}</div>}
                </td>
                <td style={td}>
                  <Chip texto={l.estado === "PENDIENTE" ? "Pendiente" : l.estado === "OK" ? "OK" : "Glosa"} color={ESTADO_COLOR[l.estado]} />
                  {l.auditado_por && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{l.auditado_por}</div>}
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {!bloqueada && (
                    <>
                      {l.estado !== "OK" && <button style={btnSmall("#16a34a")} onClick={() => guardar([l.sis_deta_id], { estado: "OK" })}>OK</button>}
                      <button style={btnSmall("#7c3aed")} onClick={() => setEditando(l)}>Glosa / ajuste</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!lineas.length && <tr><td colSpan={11} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>Sin líneas con estos filtros</td></tr>}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarLinea linea={editando} onCerrar={() => setEditando(null)}
          onGuardar={async cambios => { if (await guardar([editando.sis_deta_id], cambios)) setEditando(null); }} />
      )}
    </>
  );
}

function EditarLinea({ linea, onCerrar, onGuardar }: {
  linea: Linea; onCerrar: () => void; onGuardar: (c: Record<string, any>) => void;
}) {
  const [estado, setEstado] = useState<string>(linea.estado === "PENDIENTE" ? "GLOSA" : linea.estado);
  const [obs, setObs] = useState(linea.observacion);
  const [ajuste, setAjuste] = useState(linea.valor_ajustado != null ? String(linea.valor_ajustado) : "");
  const falta = estado === "GLOSA" && !obs.trim();
  return (
    <Modal titulo={`${linea.cups} · ${linea.paciente}`} onCerrar={onCerrar}>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
        {linea.descripcion}<br />
        Honorario calculado: <b>{fmt(linea.honorario_calculado)}</b> {linea.tarifa && `(${linea.tarifa})`}
      </div>
      <Filtro etiqueta="Resultado" flex="1">
        <div style={{ display: "flex", gap: 8 }}>
          {[["OK", "OK (se paga)"], ["GLOSA", "Glosa (no se paga)"], ["PENDIENTE", "Pendiente"]].map(([v, t]) => (
            <label key={v} style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13 }}>
              <input type="radio" checked={estado === v} onChange={() => setEstado(v)} /> {t}
            </label>
          ))}
        </div>
      </Filtro>
      {estado !== "GLOSA" && (
        <div style={{ marginTop: 12 }}>
          <Filtro etiqueta="Valor ajustado (opcional, reemplaza el calculado)" flex="1">
            <input value={ajuste} onChange={e => setAjuste(e.target.value.replace(/[^\d]/g, ""))} placeholder={String(linea.honorario_calculado)} style={inputStyle} />
          </Filtro>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Filtro etiqueta={estado === "GLOSA" ? "Motivo de la glosa (obligatorio)" : "Observación"} flex="1">
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
        </Filtro>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button onClick={onCerrar} style={btnStyle("#94a3b8")}>Cancelar</button>
        <button disabled={falta} onClick={() => onGuardar({
          estado, observacion: obs, valor_ajustado: estado === "GLOSA" ? null : (ajuste === "" ? null : Number(ajuste)),
        })} style={{ ...btnStyle("#6d28d9"), opacity: falta ? 0.5 : 1 }}>Guardar</button>
      </div>
    </Modal>
  );
}

// ── Hallazgos Lumier ────────────────────────────────────────────────────────

function HallazgosLumier({ periodo, onCambio, medicoInicial = "Todos" }: {
  periodo: string; onCambio: () => void; medicoInicial?: string;
}) {
  const [datos, setDatos] = useState<{ cargado: boolean; estudios: number; hallazgos: Hallazgo[] } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [tipoF, setTipoF] = useState("Todos");
  const [estadoF, setEstadoF] = useState("Pendientes");
  const [medicoF, setMedicoF] = useState(medicoInicial);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API}/lumier/hallazgos/`, { ...auth(), params: { periodo } });
      setDatos(data);
    } catch (e) {
      setError(errorDe(e, "No se pudieron cargar los hallazgos"));
    } finally {
      setCargando(false);
    }
  }, [periodo]);
  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (h: Hallazgo, decision: string) => {
    try {
      await axios.post(`${API}/lumier/resolver/`, { periodo, clave: h.clave, decision, nota: notas[h.clave] ?? h.nota }, auth());
      await cargar(); onCambio();
    } catch (e) {
      setError(errorDe(e, "No se pudo guardar"));
    }
  };

  if (cargando && !datos) return <Cargando />;
  if (!datos) return null;
  if (!datos.cargado) return (
    <Mensaje color="#475569" fondo="#f1f5f9" texto={`No se ha cargado el informe de Lumier de ${nombreMes(periodo)}. Use "Cargar informe de Lumier" arriba.`} />
  );
  // Médicos por código de Zeus (Lumier escribe el nombre distinto: 'William  García  Rossi')
  const nombresMedico = new Map<string, string>();
  datos.hallazgos.forEach(h => {
    if (h.cod_medico_zeus) nombresMedico.set(String(h.cod_medico_zeus), h.medico_zeus);
    if (h.cod_medico_lumier) nombresMedico.set(String(h.cod_medico_lumier), h.medico_lumier_zeus || h.medico_lumier);
  });
  const medicos = Array.from(nombresMedico.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const delMedico = (h: Hallazgo) =>
    medicoF === "Todos" || String(h.cod_medico_zeus) === medicoF || String(h.cod_medico_lumier) === medicoF;
  const lista = datos.hallazgos.filter(h =>
    (tipoF === "Todos" || h.tipo === tipoF) &&
    (estadoF === "Todos" || (estadoF === "Pendientes" ? !h.decision : !!h.decision)) && delMedico(h));
  const conteo = (t: string) => datos.hallazgos.filter(h => h.tipo === t && !h.decision && delMedico(h)).length;

  return (
    <>
      {error && <Mensaje color="#991b1b" fondo="#fee2e2" texto={error} onCerrar={() => setError("")} />}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        {Object.entries(TIPO_HALLAZGO).map(([k, v]) => (
          <div key={k} onClick={() => setTipoF(tipoF === k ? "Todos" : k)} style={{ cursor: "pointer", outline: tipoF === k ? "2px solid #6d28d9" : "none", borderRadius: 10 }}>
            <Kpi valor={String(conteo(k))} texto={v.texto} fondo={v.color[0]} color={v.color[1]} />
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <Filtro etiqueta="Médico">
          <select value={medicoF} onChange={e => setMedicoF(e.target.value)} style={selectStyle}>
            <option value="Todos">Todos</option>
            {medicos.map(([cod, nombre]) => <option key={cod} value={cod}>{nombre}</option>)}
          </select>
        </Filtro>
        <Filtro etiqueta="Estado" flex="0 1 160px">
          <select value={estadoF} onChange={e => setEstadoF(e.target.value)} style={selectStyle}>
            {["Pendientes", "Validados", "Todos"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Filtro>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>
        Cruce por documento del paciente, CUPS y fecha (±5 días). "Médico diferente": el radiólogo que leyó en Lumier no es el médico de la línea en Zeus;
        si decide pagar al de Lumier, la línea pasa a la auditoría de ese médico.
      </p>
      <div style={tablaWrap}>
        <table style={tabla}>
          <thead>
            <tr style={thRow}>{["Tipo", "Fecha", "Paciente", "Zeus", "Lumier", "Validación"].map(t => <th key={t} style={th}>{t}</th>)}</tr>
          </thead>
          <tbody>
            {lista.map(h => (
              <tr key={h.clave} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={td}><Chip texto={TIPO_HALLAZGO[h.tipo]?.texto || h.tipo} color={TIPO_HALLAZGO[h.tipo]?.color || ["#f1f5f9", "#475569"]} /></td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{fecha(h.fecha)}{h.estudio && <div style={{ fontSize: 11, color: "#94a3b8" }}>Est. {h.estudio}</div>}</td>
                <td style={td}><div style={{ fontWeight: 600 }}>{h.paciente}</div><div style={{ fontSize: 11, color: "#64748b" }}>{h.documento}</div></td>
                <td style={{ ...td, maxWidth: 260 }}>
                  {h.tipo === "SOLO_LUMIER" ? <span style={{ color: "#94a3b8" }}>—</span> : <>
                    <div style={{ fontSize: 12 }}><b>{h.cups}</b> {h.examen}</div>
                    <div style={{ fontSize: 12, color: "#1e40af", marginTop: 2 }}>{h.medico_zeus}</div>
                  </>}
                </td>
                <td style={{ ...td, maxWidth: 260 }}>
                  {h.tipo === "SOLO_ZEUS" ? <span style={{ color: "#94a3b8" }}>—</span> : <>
                    {(h.tipo === "SOLO_LUMIER" || h.tipo === "CUPS_DIFERENTE") && (
                      <div style={{ fontSize: 12 }}><b>{h.cups_lumier || h.cups}</b> {h.examen_lumier || h.examen}</div>
                    )}
                    <div style={{ fontSize: 12, color: "#0f766e", marginTop: 2 }}>{h.medico_lumier}</div>
                  </>}
                </td>
                <td style={{ ...td, minWidth: 260 }}>
                  {h.decision ? (
                    <div>
                      <Chip texto={DECISION_TEXTO[h.decision]} color={["#dcfce7", "#166534"]} />
                      {h.nota && <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{h.nota}</div>}
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{h.validado_por}
                        <button style={{ ...btnSmall("#94a3b8"), marginLeft: 6 }} onClick={() => resolver(h, "")}>Deshacer</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input value={notas[h.clave] ?? ""} onChange={e => setNotas({ ...notas, [h.clave]: e.target.value })}
                        placeholder="Nota (opcional)" style={{ ...inputStyle, width: "100%", marginBottom: 4, padding: "4px 8px", fontSize: 12 }} />
                      {h.tipo === "MEDICO_DIFERENTE" ? <>
                        <button style={btnSmall("#1e40af")} onClick={() => resolver(h, "ZEUS")}>Pagar a Zeus</button>
                        <button style={btnSmall("#0f766e")} onClick={() => resolver(h, "LUMIER")}>Pagar a Lumier</button>
                      </> : <>
                        <button style={btnSmall("#16a34a")} onClick={() => resolver(h, "REVISADO")}>Revisado</button>
                        <button style={btnSmall("#94a3b8")} onClick={() => resolver(h, "DESCARTADO")}>Descartar</button>
                      </>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>Sin hallazgos con estos filtros</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Tarifas ─────────────────────────────────────────────────────────────────

function Tarifas() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [medicosZeus, setMedicosZeus] = useState<MedicoZeus[]>([]);
  const [buscar, setBuscar] = useState("");
  const [medicoF, setMedicoF] = useState("Todos");
  const [areaF, setAreaF] = useState("Todas");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState<string[]>([]);
  const [editando, setEditando] = useState<Tarifa | null>(null);
  const [nueva, setNueva] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([
        axios.get(`${API}/tarifas/`, auth()), axios.get(`${API}/medicos/`, auth()),
      ]);
      setTarifas(t.data.tarifas); setMedicosZeus(m.data.medicos);
    } catch (e) {
      setError(errorDe(e, "No se pudieron cargar las tarifas"));
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const importar = async (archivo: File) => {
    if (tarifas.length && !window.confirm("Se reemplazarán todas las tarifas por las del Excel (las asignaciones de médico hechas a mano se conservan). ¿Continuar?")) {
      if (input.current) input.current.value = "";
      return;
    }
    const form = new FormData(); form.append("archivo", archivo);
    try {
      const { data } = await axios.post(`${API}/tarifas/importar/`, form, auth());
      setAviso([`${data.tarifas} tarifas importadas.`, ...data.avisos]);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo importar el Excel"));
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  const asignar = async (encabezado: string, cod: string) => {
    try {
      await axios.post(`${API}/tarifas/asignar-medico/`, { encabezado, cod_medico: cod }, auth());
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo asignar el médico"));
    }
  };

  const encabezados = useMemo(() => {
    const m = new Map<string, { encabezado: string; cod: number | null; medico: string; area: string }>();
    tarifas.forEach(t => m.set(t.encabezado, { encabezado: t.encabezado, cod: t.cod_medico, medico: t.medico, area: t.area }));
    return Array.from(m.values()).sort((a, b) => a.encabezado.localeCompare(b.encabezado));
  }, [tarifas]);
  const areas = Array.from(new Set(tarifas.map(t => t.area))).sort();
  const lista = tarifas.filter(t =>
    (medicoF === "Todos" || t.encabezado === medicoF) && (areaF === "Todas" || t.area === areaF) &&
    (!buscar || `${t.cups} ${t.descripcion} ${t.medico}`.toLowerCase().includes(buscar.toLowerCase())));
  const sinMedico = encabezados.filter(e => e.cod == null);

  return (
    <>
      {error && <Mensaje color="#991b1b" fondo="#fee2e2" texto={error} onCerrar={() => setError("")} />}
      {aviso.length > 0 && (
        <div style={{ background: "#fef9c3", color: "#713f12", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
          {aviso.map((a, i) => <div key={i}>{i === 0 ? <b>{a}</b> : `• ${a}`}</div>)}
          <button style={{ ...btnSmall("#a16207"), marginTop: 6 }} onClick={() => setAviso([])}>Cerrar</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Filtro etiqueta="Buscar"><input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="CUPS o descripción" style={inputStyle} /></Filtro>
        <Filtro etiqueta="Hoja del Excel" flex="0 1 180px">
          <select value={areaF} onChange={e => setAreaF(e.target.value)} style={selectStyle}>
            <option value="Todas">Todas</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Filtro>
        <Filtro etiqueta="Médico">
          <select value={medicoF} onChange={e => setMedicoF(e.target.value)} style={selectStyle}>
            <option value="Todos">Todos ({tarifas.length})</option>
            {encabezados.map(e => <option key={e.encabezado} value={e.encabezado}>{e.medico || e.encabezado}</option>)}
          </select>
        </Filtro>
        <div style={{ flex: 1 }} />
        <button onClick={() => setNueva(true)} style={btnStyle("#6d28d9")}>Nueva tarifa</button>
        <input ref={input} type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => e.target.files?.[0] && importar(e.target.files[0])} />
        <button onClick={() => input.current?.click()} style={btnStyle("#0f766e")}>Importar Excel de tarifas</button>
      </div>

      {(sinMedico.length > 0 || medicoF !== "Todos") && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>MÉDICO DE ZEUS PARA CADA NOMBRE DEL EXCEL</div>
          {(medicoF !== "Todos" ? encabezados.filter(e => e.encabezado === medicoF) : sinMedico).map(e => (
            <div key={e.encabezado} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, fontSize: 13 }}>
              <span style={{ minWidth: 220 }}><b>{e.encabezado}</b> <span style={{ color: "#94a3b8" }}>({e.area})</span></span>
              <select value={e.cod ?? ""} onChange={ev => asignar(e.encabezado, ev.target.value)} style={{ ...selectStyle, maxWidth: 360 }}>
                <option value="">— Sin asignar —</option>
                {medicosZeus.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre} · {m.especialidad}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div style={tablaWrap}>
        <table style={tabla}>
          <thead><tr style={thRow}>{["Médico", "CUPS", "Grupo", "Tarifa", "Excel", ""].map(t => <th key={t} style={th}>{t}</th>)}</tr></thead>
          <tbody>
            {lista.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: t.activo ? 1 : 0.45 }}>
                <td style={td}><div style={{ fontWeight: 600 }}>{t.medico}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{t.area}</div></td>
                <td style={{ ...td, maxWidth: 360 }}><b>{t.cups}</b> {t.descripcion}</td>
                <td style={td}>{GRUPO_TEXTO[t.grupo]}{t.solo_contrato && <div style={{ fontSize: 11, color: "#b45309" }}>Solo {t.solo_contrato}</div>}</td>
                <td style={{ ...td, fontWeight: 600 }}>{t.texto}</td>
                <td style={{ ...td, fontSize: 11, color: "#94a3b8", maxWidth: 160 }}>{t.texto_original}</td>
                <td style={td}><button style={btnSmall("#7c3aed")} onClick={() => setEditando(t)}>Editar</button></td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
              {tarifas.length ? "Sin tarifas con estos filtros" : "Aún no hay tarifas: importe el Excel 'Cups Neuro - Honorarios médicos'"}
            </td></tr>}
          </tbody>
        </table>
      </div>

      {(editando || nueva) && (
        <EditarTarifa tarifa={editando} medicos={medicosZeus}
          onCerrar={() => { setEditando(null); setNueva(false); }}
          onGuardado={() => { setEditando(null); setNueva(false); cargar(); }} />
      )}
    </>
  );
}

function EditarTarifa({ tarifa, medicos, onCerrar, onGuardado }: {
  tarifa: Tarifa | null; medicos: MedicoZeus[]; onCerrar: () => void; onGuardado: () => void;
}) {
  const [f, setF] = useState({
    cod_medico: tarifa?.cod_medico != null ? String(tarifa.cod_medico) : "", cups: tarifa?.cups || "",
    descripcion: tarifa?.descripcion || "", grupo: tarifa?.grupo || "TODOS", tipo: tarifa?.tipo || "FIJO",
    valor: tarifa?.valor != null ? String(tarifa.valor) : "", porcentaje: tarifa?.porcentaje != null ? String(tarifa.porcentaje) : "",
    max_puntos: tarifa?.max_puntos != null ? String(tarifa.max_puntos) : "", escalas: tarifa?.escalas || "",
    por_unidad: tarifa?.por_unidad || false, solo_contrato: tarifa?.solo_contrato || "", activo: tarifa?.activo ?? true,
  });
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setF(prev => ({ ...prev, [k]: v }));
  const guardar = async () => {
    try {
      if (tarifa) await axios.post(`${API}/tarifas/${tarifa.id}/`, f, auth());
      else await axios.post(`${API}/tarifas/nueva/`, f, auth());
      onGuardado();
    } catch (e) {
      setError(errorDe(e, "No se pudo guardar"));
    }
  };
  return (
    <Modal titulo={tarifa ? `${tarifa.cups} · ${tarifa.medico}` : "Nueva tarifa"} onCerrar={onCerrar}>
      {error && <Mensaje color="#991b1b" fondo="#fee2e2" texto={error} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {!tarifa && <>
          <Filtro etiqueta="Médico" flex="1">
            <select value={f.cod_medico} onChange={e => set("cod_medico", e.target.value)} style={selectStyle}>
              <option value="">Seleccione…</option>
              {medicos.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
            </select>
          </Filtro>
          <Filtro etiqueta="CUPS" flex="1"><input value={f.cups} onChange={e => set("cups", e.target.value)} style={inputStyle} /></Filtro>
          <div style={{ gridColumn: "1 / 3" }}>
            <Filtro etiqueta="Descripción" flex="1"><input value={f.descripcion} onChange={e => set("descripcion", e.target.value)} style={{ ...inputStyle, width: "100%" }} /></Filtro>
          </div>
        </>}
        <Filtro etiqueta="Grupo de entidades" flex="1">
          <select value={f.grupo} onChange={e => set("grupo", e.target.value)} style={selectStyle}>
            {Object.entries(GRUPO_TEXTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Filtro>
        <Filtro etiqueta="Tipo" flex="1">
          <select value={f.tipo} onChange={e => set("tipo", e.target.value)} style={selectStyle}>
            {Object.entries(TIPO_TARIFA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Filtro>
        {(f.tipo === "FIJO" || f.tipo === "POR_PUNTO") && (
          <Filtro etiqueta={f.tipo === "POR_PUNTO" ? "Valor por punto" : "Valor"} flex="1">
            <input value={f.valor} onChange={e => set("valor", e.target.value.replace(/[^\d]/g, ""))} style={inputStyle} />
          </Filtro>
        )}
        {f.tipo === "PORCENTAJE" && (
          <Filtro etiqueta="Porcentaje del valor facturado" flex="1">
            <input value={f.porcentaje} onChange={e => set("porcentaje", e.target.value.replace(/[^\d.]/g, ""))} style={inputStyle} />
          </Filtro>
        )}
        {f.tipo === "POR_PUNTO" && (
          <Filtro etiqueta="Máximo de puntos (opcional)" flex="1">
            <input value={f.max_puntos} onChange={e => set("max_puntos", e.target.value.replace(/[^\d]/g, ""))} style={inputStyle} />
          </Filtro>
        )}
        {f.tipo === "ESCALONADO" && (
          <Filtro etiqueta="Valores para 1, 2, 3… procedimientos (separados por coma)" flex="1">
            <input value={f.escalas} onChange={e => set("escalas", e.target.value.replace(/[^\d,]/g, ""))} style={inputStyle} />
          </Filtro>
        )}
        <Filtro etiqueta="Solo para el contrato (opcional)" flex="1">
          <input value={f.solo_contrato} onChange={e => set("solo_contrato", e.target.value)} placeholder="ej. IPS CONSULTORIO" style={inputStyle} />
        </Filtro>
      </div>
      {f.tipo === "FIJO" && (
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, marginTop: 12 }}>
          <input type="checkbox" checked={f.por_unidad} onChange={e => set("por_unidad", e.target.checked)} />
          Multiplicar por la cantidad (cada nervio, cada extremidad, cada punto)
        </label>
      )}
      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, marginTop: 8 }}>
        <input type="checkbox" checked={f.activo} onChange={e => set("activo", e.target.checked)} /> Tarifa activa
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button onClick={onCerrar} style={btnStyle("#94a3b8")}>Cancelar</button>
        <button onClick={guardar} style={btnStyle("#6d28d9")}>Guardar</button>
      </div>
    </Modal>
  );
}

// ── piezas comunes ──────────────────────────────────────────────────────────

function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{titulo}</div>
          <button onClick={onCerrar} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Kpi({ valor, texto, fondo, color }: { valor: string; texto: string; fondo: string; color: string }) {
  return (
    <div style={{ background: fondo, borderRadius: 10, padding: "10px 18px", minWidth: 130, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{texto}</div>
    </div>
  );
}

function Chip({ texto, color }: { texto: string; color: [string, string] }) {
  return (
    <span style={{ display: "inline-block", background: color[0], color: color[1], borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
      {texto}
    </span>
  );
}

function Mensaje({ texto, color, fondo, onCerrar }: { texto: string; color: string; fondo: string; onCerrar?: () => void }) {
  return (
    <div style={{ background: fondo, color, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ flex: 1 }}>{texto}</span>
      {onCerrar && <button onClick={onCerrar} style={{ border: "none", background: "transparent", color, cursor: "pointer", fontSize: 16 }}>×</button>}
    </div>
  );
}

function Cargando() {
  return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Cargando…</div>;
}

function Filtro({ etiqueta, flex = "0 1 240px", children }: { etiqueta: string; flex?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>{etiqueta}</span>
      {children}
    </div>
  );
}

const tablaWrap: React.CSSProperties = { overflowX: "auto", background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" };
const tabla: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thRow: React.CSSProperties = { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const tdNum: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };
const selectStyle: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #c4b5fd", borderRadius: 7, fontSize: 13, outline: "none", background: "#fff", width: "100%", maxWidth: 320,
};
const inputStyle: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #c4b5fd", borderRadius: 7, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box",
};
const btnStyle = (color: string): React.CSSProperties => ({
  padding: "7px 16px", background: color, color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 600, fontSize: 13,
});
const btnSmall = (color: string): React.CSSProperties => ({
  padding: "4px 10px", background: color, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
  marginRight: 4, marginBottom: 3,
});
