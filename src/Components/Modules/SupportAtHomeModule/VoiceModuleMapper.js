import React, { useState } from "react";
import "../../../Styles/VoiceModuleMapper.css";

const MapperGrid = ({ rows, setRows }) => {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const updateRow = (index, key, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [key]: value };
    setRows(updated);
  };

  const addRowBelow = (index) => {
    const newRow = {
      template_field: "",
      source: "",
      type: "text",
      required: false
    };
    const updated = [...rows];
    updated.splice(index + 1, 0, newRow);
    setRows(updated);
    setOpenMenuIndex(null);
  };

  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
    setOpenMenuIndex(null);
  };

  return (
    <div className="mapper-grid">
      {/* HEADER */}
      <div className="mapper-header mapper-grid-layout">
        <div className="cell">Template Field</div>
        <div className="cell">Source</div>
        <div className="cell center">Type</div>
        <div className="cell center">Required</div>
        <div className="cell center" />
      </div>

      {/* ROWS */}
      {rows.map((row, index) => (
        <div
          key={index}
          className="mapper-row mapper-grid-layout"
          onMouseLeave={() => setOpenMenuIndex(null)}
        >
          <div className="cell">
            <input
              value={row.template_field}
              onChange={(e) =>
                updateRow(index, "template_field", e.target.value)
              }
              placeholder="Field name"
            />
          </div>

          <div className="cell">
            <input
              value={row.source}
              onChange={(e) => updateRow(index, "source", e.target.value)}
              placeholder="transcript.path"
            />
          </div>

          <div className="cell center">
            <select
              value={row.type}
              onChange={(e) => updateRow(index, "type", e.target.value)}
            >
              <option value="text">text</option>
              <option value="date">date</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
          </div>

          <div className="cell center">
            <input
              type="checkbox"
              checked={row.required}
              onChange={(e) =>
                updateRow(index, "required", e.target.checked)
              }
            />
          </div>

          <div className="cell center actions">
            <span
              className="dots"
              onClick={() =>
                setOpenMenuIndex(openMenuIndex === index ? null : index)
              }
            >
              ⋮
            </span>

            {openMenuIndex === index && (
              <div className="row-menu">
                <div onClick={() => addRowBelow(index)}>➕ Add row below</div>
                <div onClick={() => deleteRow(index)}>🗑 Delete row</div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div
        className="add-last-row"
        onClick={() => addRowBelow(rows.length - 1)}
      >
        ➕ Add new field
      </div>
    </div>
  );
};

export default MapperGrid;
