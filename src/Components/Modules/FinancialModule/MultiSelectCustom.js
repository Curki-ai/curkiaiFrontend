import React, { useState, useRef, useEffect } from "react";

const MultiSelectCustom = ({
  options = [],
  selected = [],
  setSelected,
  placeholder,
  leftIcon,
  rightIcon,
  height = 38,
  minWidth = 220,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const toggleOption = (option) => {
    if (selected.some((o) => o.value === option.value)) {
      setSelected(selected.filter((o) => o.value !== option.value));
    } else {
      setSelected([...selected, option]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="custom-multiselect"
      ref={ref}
      style={{ position: "relative", minWidth }}
    >
      {/* INPUT */}
      <div
        className="custom-input"
        onClick={() => setOpen(!open)}
        style={{
          height: placeholder === "Role" ? "31px" : height,
          display: "flex",
          alignItems: "center",
          border: "1px solid #D1D5DB",
          borderRadius: "8px",
          paddingLeft: leftIcon ? "36px" : "12px",
          paddingRight: rightIcon ? "36px" : "12px",
          cursor: "pointer",
          background: "#fff",
          fontFamily: "Inter",
        }}
      >
        {/* LEFT ICON */}
        {leftIcon && (
          <img
            src={leftIcon}
            alt="icon"
            style={{
              position: "absolute",
              left: "10px",
              width: "16px",
              height: "16px",
              pointerEvents: "none",
            }}
          />
        )}

        {/* TEXT */}
        <span
          style={{
            color: selected.length === 0 ? "#9CA3AF" : "#111827",
            fontSize: "13px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {selected.length === 0
            ? placeholder
            : selected.length === 1
            ? selected[0].label
            : (
              <>
                {selected[0].label}{" "}
                <span style={{ color: "#6C4CDC", fontSize: "12px" }}>
                  +{selected.length - 1}
                </span>
              </>
            )}
        </span>

        {/* RIGHT ICON */}
        {rightIcon && (
          <img
            src={rightIcon}
            alt="arrow"
            style={{
              position: "absolute",
              right: "10px",
              width: "12px",
              height: "7px",
              pointerEvents: "none",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        )}
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="options-dropdown">
          {options.map((option) => {
            const isSelected = selected.some(
              (o) => o.value === option.value
            );
            return (
              <div
                key={option.value}
                className={`option-item ${isSelected ? "selected" : ""}`}
                onClick={() => toggleOption(option)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="custom-checkbox"
                />
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectCustom;
