import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../../config/token.jsx";
import CONFIG from '../../../config/api';

const API = `${CONFIG.API_ENDPOINT}/gestion-facturacion`;

interface Archivo {
  id: number;
  tipo: string;
  nombre: string;
  fecha: string | null;
}

interface DetalleData {
  admision_id: number;
  zeus: {
    paciente: string;
    documento: string;
    eps: string;
    fecha_ing: string | null;
    regimen: string;
    valor_total: number;
  };
  archivos: Archivo[];
}

interface Props {
  admisionId: number;
  bandeja: string;
  onClose: () => void;
}

function fmt(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}

const TIPO_COLOR: Record<string, string> = {
  RESULTADO:    "#6366f1",
  FACTURA:      "#10b981",
  ORDEN:        "#f59e0b",
  AUTORIZACION: "#3b82f6",
  COMPROBANTE:  "#ec4899",
  DEVOLUCION:   "#ef4444",
};

export default function DetalleCasoDrawer({ admisionId, bandeja, onClose }: Props) {
  const [data, setData]       = useState<DetalleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/caso/${admisionId}/`, {
        headers: { Authorization: `Token ${getToken()}` },
      })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [admisionId]);

  const descargar = (id: number) => {
    window.open(`/api/v2/descargar/${id}/`, "_blank");
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 1000,
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: Math.min(500, window.innerWidth),
        background: "#fff", zIndex: 1001,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        fontFamily: "inherit",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 20px", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f8fafc",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>
              Admisión {admisionId}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Bandeja: {bandeja}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8" }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Cargando...</div>
          )}

          {!loading && data && (
            <>
              {/* Datos del paciente */}
              <section style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  Paciente
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["Nombre",   data.zeus.paciente || "—"],
                    ["Documento", data.zeus.documento || "—"],
                    ["EPS",       data.zeus.eps || "—"],
                    ["Régimen",   data.zeus.regimen === "C" ? "Contributivo" : data.zeus.regimen === "S" ? "Subsidiado" : (data.zeus.regimen || "—")],
                    ["Ingreso",   data.zeus.fecha_ing || "—"],
                    ["Valor total", fmt(data.zeus.valor_total)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
                      <div style={{ fontSize: 13, color: "#1e293b", marginTop: 2, fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Archivos */}
              <section>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  Archivos ({data.archivos.length})
                </h3>
                {data.archivos.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>Sin archivos registrados.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.archivos.map(a => (
                      <div key={a.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#f8fafc", borderRadius: 8, padding: "10px 14px",
                        border: "1px solid #e2e8f0",
                      }}>
                        <div>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 20,
                            fontSize: 11, fontWeight: 700,
                            background: TIPO_COLOR[a.tipo] || "#64748b",
                            color: "#fff", marginRight: 8,
                          }}>
                            {a.tipo}
                          </span>
                          <span style={{ fontSize: 13, color: "#334155" }}>{a.nombre}</span>
                          {a.fecha && (
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, marginLeft: 2 }}>
                              {a.fecha.substring(0, 10)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => descargar(a.id)}
                          style={{
                            padding: "5px 12px", background: "#3b82f6", color: "#fff",
                            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}
                        >
                          Ver
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {!loading && !data && (
            <div style={{ textAlign: "center", padding: 40, color: "#ef4444" }}>
              Error al cargar el detalle.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
