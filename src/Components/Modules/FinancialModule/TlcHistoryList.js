import TlcPayrollHistoryIcon from "../../../Images/TlcPayrollHistory.png"

const HistoryList = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: 0.5,          // disabled look
        cursor: "not-allowed",
        userSelect: "none",
      }}
    >
      <img
        src={TlcPayrollHistoryIcon}
        alt="History"
        style={{ width: "20px", height: "20px" }}
      />
      <span
        style={{
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter",
        }}
      >
        History
      </span>
    </div>
  );
};

export default HistoryList;
