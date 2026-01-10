// import React, { useState } from "react";

// const JsonTableCard = ({ title, summaryTable, detailsTable }) => {
//   const [openGroups, setOpenGroups] = useState({});

//   // Proper summary formatting by column order
//   const summary = summaryTable?.columns && summaryTable?.rows
//     ? [
//         summaryTable.columns,
//         ...summaryTable.rows.map(row =>
//           summaryTable.columns.map(col => row[col])
//         )
//       ]
//     : summaryTable;

//   // Details table
//   const details = detailsTable?.columns && detailsTable?.rows
//     ? {
//         headers: detailsTable.columns,
//         rows: detailsTable.rows
//       }
//     : { headers: [], rows: [] };

//   if (!summary?.length) {
//     return (
//       <div className="client-profitabilty-graph-each">
//         <h3>{title}</h3>
//         <p>No data available</p>
//       </div>
//     );
//   }

//   return (
//     <div className="client-profitabilty-graph-each">
//       <h3 style={{ marginBottom: 16 }}>{title}</h3>

//       <div style={{ maxHeight: 600, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8,width:"100%" }}>
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>

//           {/* HEADER */}
//           <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 ,width:"100%"}}>
//             <tr>
//               <th style={{ padding: 12, borderBottom: "2px solid #e5e7eb" }}></th>
//               {summary[0].map((col, idx) => (
//                 <th key={idx} style={{ padding: 12, borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
//                   {col}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {summary.slice(1).map((parentRow, idx) => {
//               const expanded = openGroups[idx];

//               // Reference column matching
//               const refIndex = summary[0].indexOf("NDIS Reference");
//               const parentRef = parentRow[refIndex];

//               const childRows = details.rows.filter(
//                 (child) => child["NDIS Reference"]?.toString() === parentRef?.toString()
//               );

//               const hasChildren = childRows.length > 0;

//               return (
//                 <React.Fragment key={idx}>
//                   {/* Parent */}
//                   <tr style={{ borderBottom: "1px solid #e5e7eb",width:"100%" }}>
//                     <td style={{ textAlign: "left", padding: "12px" }}>
//                       {hasChildren && (
//                         <button
//                           onClick={() => setOpenGroups((prev) => ({ ...prev, [idx]: !prev[idx] }))}
//                           style={{ border: "none", background: "transparent", fontSize: 16, cursor: "pointer" }}
//                         >
//                           {expanded ? "−" : "+"}
//                         </button>
//                       )}
//                     </td>
//                     {parentRow.map((cell, cidx) => (
//                       <td key={cidx} style={{textAlign:"left", padding: "12px" }}>{cell}</td>
//                     ))}
//                   </tr>

//                   {/* Children */}
//                   {expanded && hasChildren && (
//                     <>
//                       <tr style={{ backgroundColor: "#edf2f7" }}>
//                         <td></td>
//                         {details.headers.map((head, hidx) => (
//                           <td key={hidx} style={{ textAlign:"left", padding: 12, fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>
//                             {head}
//                           </td>
//                         ))}
//                       </tr>

//                       {childRows.map((row, rIdx) => (
//                         <tr key={rIdx} style={{ textAlign:"left", backgroundColor: "#fafafa" }}>
//                           <td></td>
//                           {details.headers.map((colName, colIdx) => (
//                             <td key={colIdx} style={{ padding: 12 }}>
//                               {row[colName] ?? ""}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </>
//                   )}
//                 </React.Fragment>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default JsonTableCard;



import React, { useState, useMemo } from "react";

/**
 * Format numbers to 2 decimal places
 */
const formatValue = (value) => {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  if (!isNaN(value) && value !== "" && value !== null) {
    return Number(value).toFixed(2);
  }

  return value ?? "";
};

const JsonTableCard = ({ title, data }) => {
  const COLUMN_WIDTHS = {
    "Client Name": "210px",
    "Region": "80px",
    "Department": "130px",
    "Revenue": "130px",
    "Direct Cost": "130px",
    "Gross Profit": "130px",
    "Gross Profit %": "135px",
    "Gross Margin": "130px",
    "Gross Margin %": "127px",
    "Indirect Cost": "130px",
    "Allocated Cost": "140px",
    "Total Expense": "140px",
  };

  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  // ✅ SAFE DEFAULTS (important)
  const columns = data?.columns || [];
  const rows = data?.rows || [];

  /**
   * Hooks MUST be before any return
   */
  const regions = useMemo(() => {
    return ["ALL", ...Array.from(new Set(rows.map(r => r.Region).filter(Boolean)))];
  }, [rows]);

  const departments = useMemo(() => {
    return ["ALL", ...Array.from(new Set(rows.map(r => r.Department).filter(Boolean)))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const regionMatch =
        selectedRegion === "ALL" || row.Region === selectedRegion;

      const departmentMatch =
        selectedDepartment === "ALL" || row.Department === selectedDepartment;

      return regionMatch && departmentMatch;
    });
  }, [rows, selectedRegion, selectedDepartment]);

  /**
   * ✅ EARLY RETURN AFTER HOOKS
   */
  if (!columns.length || !rows.length) {
    return (
      <div className="client-profitabilty-graph-each">
        <h3>{title}</h3>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="client-profitabilty-graph-each">
      {/* FILTERS */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{ padding: "8px", borderRadius: 6 }}
        >
          {regions.map((r, i) => (
            <option key={i} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={{ padding: "8px", borderRadius: 6 }}
        >
          {departments.map((d, i) => (
            <option key={i} value={d}>
              {d}
            </option>
          ))}
        </select>

        <span style={{ fontSize: 12, color: "#6b7280" }}>
          Showing {filteredRows.length} of {rows.length} rows
        </span>
      </div>

      {/* TABLE */}
      <div
        style={{
          maxHeight: 600,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          width: "100%",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#f8fafc",
              zIndex: 10,
            }}
          >
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: 12,
                    borderBottom: "2px solid #e5e7eb",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    // width: col === "Client Name" ? "220px" : "auto",
                    width: COLUMN_WIDTHS[col] || "120px",

                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    style={{
                      padding: 12,
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      width: COLUMN_WIDTHS[col] || "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JsonTableCard;
