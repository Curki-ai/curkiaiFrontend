import React, { useState, useEffect, useRef } from "react";
import detailedUsageDownArrow from "../../Images/detailedUsageDownArrow.svg";
import "../../Styles/DetailedUsageCustomSelect.css";

const CustomRangeSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Select";

  return (
    <div className="crs-container" ref={dropdownRef}>
      <div
        className={`crs-header ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className="crs-selected">{selectedLabel}</span>

        <img
          src={detailedUsageDownArrow}
          alt="dropdown"
          className={`crs-arrow ${open ? "rotate" : ""}`}
        />
      </div>

      {open && (
        <div className="crs-dropdown">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`crs-option ${
                value === opt.value ? "active" : ""
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomRangeSelect;