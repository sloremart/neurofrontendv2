import React, { useState } from "react";
import axios from "axios";
import { getToken } from "../../../config/token.jsx";
import CONFIG from '../../../config/api';

const API = `${CONFIG.API_ENDPOINT}/gestion-facturacion`;

interface Props {
  onClose: () => void;
  onGuardado: () => void;
}

export default function RegistrarDevolucionModal({ onClose, onGuardado }: Props) {
  const [admisionId, setAdmisionId]       = useState("");
  const [motivo, setMotivo]               = useState("");
  const [observacion, setObservacion]     = useState("");
  const [guardando, setGuardando]         = useState(false);
  const [error, setError]                 = useState("");

  const guardar = async () => {
    if (!admisionId || !motivo) {
      setError("Admisión y motivo son obligatorios.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await axios.post(
        `${API}/devoluciones/`,
        { admision_id: parseInt(admisionId), motivo_devolucion: motivo, observacion },
        { headers: { Authorization: `Token ${getToken()}` } },
      );
      onGuardado();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al registrar la devolución.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fff", borderRadius: 12, padding: 28,
        width: Math.min(460, window.innerWidth - 32),
        zIndex: 2001, fontFamily: "inherit",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Registrar devolución EPS
          </h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Admisión *</label>
            <input
              type="number"
              value={admisionId}
              onChange={e => setAdmisionId(e.target.value)}
              placeholder="Número de admisión"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Motivo de devolución *</label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Glosa por falta de autorización"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Observación</label>
            <textarea
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 18px", border: "1px solid #e2e8f0", borderRadius: 7,
                background: "#fff", cursor: "pointer", fontSize: 14, color: "#475569",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{
                padding: "8px 20px", border: "none", borderRadius: 7,
                background: guardando ? "#94a3b8" : "#ef4444",
                color: "#fff", cursor: guardando ? "default" : "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              {guardando ? "Guardando..." : "Registrar devolución"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#475569", marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  border: "1px solid #e2e8f0", borderRadius: 7,
  fontSize: 14, outline: "none", background: "#fff",
  boxSizing: "border-box",
};
