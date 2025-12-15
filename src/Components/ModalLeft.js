import React from "react";
import "../Styles/Modal.css";

/**
 * Content per module
 * (Kept separate per module)
 */
const modalContentByModule = {
  "Payroll Analysis": {
    title: "What This Payroll Analysis Covers",
    points: [
      {
        title: "Employee Compensation Analysis",
        text:
          "Insights into gross earnings and net pay help identify the salary structure and overall compensation patterns across different employee categories."
      },
      {
        title: "Overtime Management",
        text:
          "Tracking overtime hours (e.g., Overtime 1.50 and Overtime 2.0) allows for effective management of labor costs and compliance with fair work regulations."
      },
      {
        title: "Leave Tracking",
        text:
          "Detailed records of various leave types (Annual, Personal, Unpaid, etc.) support effective workforce planning and identify potential staffing shortages."
      },
      {
        title: "Compliance with Legislation",
        text:
          "Ensures proper calculation and reporting of tax withholding and superannuation contributions, aiding in compliance with labor laws."
      },
      {
        title: "Cost Centre Analysis",
        text:
          "The ability to analyze payroll expenses by cost centres facilitates targeted budgeting and financial reporting for different departments or units."
      },
      {
        title: "Allowances and Benefits Overview",
        text:
          "Insights into different allowances (e.g., km allowances, shift allowances) help in evaluating cost-effectiveness and employee satisfaction with benefits."
      },
      {
        title: "Employee Performance Metrics",
        text:
          "Tracking hours worked, including penalty hours (Sunday, Saturday, and Night Hours), assists in performance assessments and productivity analysis."
      },
      {
        title: "Forecasting Future Labor Costs",
        text:
          "Historical payroll data allows for trend analysis and forecasting of future labor costs, supporting budgetary planning."
      },
      {
        title: "Aggregated Reporting for Management",
        text:
          "Summarizing payroll metrics gives leadership an overview of company expenses, aiding in strategic decision-making."
      },
      {
        title: "Data-Driven Insights for HR Policies",
        text:
          "Comprehensive payroll insights can inform the development and refinement of HR policies regarding compensation, benefits, and employee engagement strategies."
      }
    ],
    footer:
      "This analysis supports both operational efficiency and strategic planning within HR and finance functions."
  },

  "Financial Health": {
    title: "Financial Health Insights",
    points: [
      {
        title: "Revenue vs Expense Analysis",
        text:
          "Provides visibility into financial performance and long-term sustainability."
      },
      {
        title: "Cash Flow Monitoring",
        text:
          "Tracks inflows and outflows to ensure operational stability."
      },
      {
        title: "Risk Indicators",
        text:
          "Identifies potential financial risks early for proactive decision-making."
      }
    ]
  },

  "Smart Rostering": {
    title: "Smart Rostering Capabilities",
    points: [
      {
        title: "Workforce Availability",
        text:
          "Displays real-time staff availability to prevent understaffing."
      },
      {
        title: "Roster Compliance",
        text:
          "Ensures rosters align with award rules and compliance standards."
      },
      {
        title: "Efficiency Optimization",
        text:
          "Improves workforce utilization and reduces idle time."
      }
    ]
  }
};

/**
 * Popup Modal Component
 */
const PopupModalLeft = ({ isVisible, onClose, module }) => {
  if (!isVisible) return null;

  // ✅ Safe fallback
  const content =
    modalContentByModule[module] ||
    modalContentByModule["Payroll Analysis"];

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* CLOSE BUTTON */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="closes-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="modal-content">
          {/* <h3 style={{ marginBottom: "14px" }}>{content.title}</h3> */}

          {content.points.map((item, index) => (
            <p key={index} style={{ marginBottom: "10px" }}>
              <strong>{item.title}:</strong> {item.text}
            </p>
          ))}

          {content.footer && (
            <p style={{ marginTop: "16px", fontStyle: "italic", color: "#555" }}>
              {content.footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupModalLeft;
