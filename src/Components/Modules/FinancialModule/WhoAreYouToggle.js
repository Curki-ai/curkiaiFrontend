import React from "react";

const WhoAreYouToggle = ({
  value,
  onChange,
  options = ["Aged Care", "NDIS"],
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        Who are you ?
      </div>

      <div
        style={{
          display: "flex",
          border: "1px solid #6C4CDC",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {options.map((item) => (
          <div
            key={item}
            onClick={() => onChange(item)}
            style={{
              width: "92px",
              textAlign: "center",
              padding: "6px 0",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              background: value === item ? "#6C4CDC" : "#fff",
              color: value === item ? "#fff" : "#6C4CDC",
              transition: "all 0.2s ease",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhoAreYouToggle;
