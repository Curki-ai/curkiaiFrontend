import React from "react";
import insight1 from "../../../Images/Graph.png";
import insight2 from "../../../Images/Graph.png";
import insight3 from "../../../Images/Graph.png";
import insight4 from "../../../Images/Graph.png";
import "../../../Styles/StaffComplianceDashboard.css";
const StaffInsights = () => {
  return (
    <div className="insights-container">
      <div className="insights-track">
        {[insight1, insight2, insight3, insight4].map((img, idx) => (
          <div key={idx} className="insight-card">
            <img src={img} alt={`Insight ${idx + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffInsights;
