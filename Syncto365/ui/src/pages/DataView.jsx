import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function DataView() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const rows = state?.rows || [];
  const meta = state?.meta || {};

  // derive columns from first row
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="container">
      <h1>Data View</h1>
      <div className="card">
        <div style={{ marginBottom: 8 }}>
          <strong>Company:</strong> {meta.company?.Name || "—"} &nbsp;
          <strong>Type:</strong> {meta.type || "—"} &nbsp;
          <strong>Count:</strong> {meta.count ?? rows.length}
        </div>

        <button onClick={() => navigate(-1)}>⬅ Back</button>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c + i}>
                      {typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length || 1}>No records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
