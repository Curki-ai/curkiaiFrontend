import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import "../../Styles/general-styles/TeamMembers.css";
const StatusDropdown = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const options = ["Active", "Restricted"];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="team-status-dropdown" ref={ref}>
      <div
        className={`status-pill ${value === "Active" ? "active-pill" : "restricted-pill"} ${disabled ? "disabled-pill" : ""}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        {value}
        <FiChevronDown size={14} />
      </div>

      {open && (
        <div className="team-status-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={`team-status-dropdown-item ${opt === value ? "selected" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;