import React, { forwardRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TlcPayrollRoleDownArrowIcon from "../../../Images/TlcPayrollRoleDownArrow.png";
import TlcPayrollDateFilterIcon from "../../../Images/TlcPayrollDateFilterIcon.png";

/* ---------- CUSTOM INPUT ---------- */
const DateRangeInput = forwardRef(
  ({ startDate, endDate, isOpen, onClick }, ref) => {
    const hasStart = !!startDate;
    const hasEnd = !!endDate;

    return (
      <div
        ref={ref}
        onClick={onClick}   // ✅ THIS WAS MISSING
        className="custom-input"
        style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          border: "1px solid #D1D5DB",
          borderRadius: "8px",
          paddingLeft: "36px",
          paddingRight: "36px",
          cursor: "pointer",
          background: "#fff",
          fontFamily: "Inter",
          position: "relative",
          minWidth: 220,
        }}
      >
        {/* LEFT ICON */}
        <img
          src={TlcPayrollDateFilterIcon}
          alt="date"
          style={{
            position: "absolute",
            left: "10px",
            width: "16px",
            height: "16px",
            pointerEvents: "none",
          }}
        />

        {/* TEXT */}
        <span
          style={{
            fontSize: "13px",
            color: hasStart ? "#111827" : "#9CA3AF",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {!hasStart && "Select Date Range"}
          {hasStart && !hasEnd && startDate.toLocaleDateString()}
          {hasStart && hasEnd &&
            `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
        </span>

        {/* RIGHT ARROW */}
        <img
          src={TlcPayrollRoleDownArrowIcon}
          alt="arrow"
          style={{
            position: "absolute",
            right: "10px",
            width: "12px",
            height: "7px",
            pointerEvents: "none",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </div>
    );
  }
);

/* ---------- MAIN WRAPPER ---------- */
export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DatePicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={onChange}
      dateFormat="dd/MM/yy"

      /* Arrow sync only */
      onCalendarOpen={() => setIsOpen(true)}
      onCalendarClose={() => setIsOpen(false)}

      customInput={
        <DateRangeInput
          startDate={startDate}
          endDate={endDate}
          isOpen={isOpen}
        />
      }
    />
  );
}
