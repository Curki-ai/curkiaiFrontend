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
                    "Compares income against operational costs to reveal true profitability across clients, services, and time periods."
            },
            {
                title: "Cash Flow Visibility",
                text:
                    "Tracks receivables, payables, and cash movement to highlight potential liquidity risks early."
            },
            {
                title: "Funding Utilisation Insights",
                text:
                    "Identifies unspent or underutilised funds to prevent expiries and maximise funding efficiency."
            },
            {
                title: "Expense Trend Detection",
                text:
                    "Monitors rising cost patterns such as wages, overtime, and service delivery expenses that may erode margins."
            },
            {
                title: "Client-Level Financial Risk Flags",
                text:
                    "Surfaces clients or services that consistently operate at low or negative margins."
            },
            {
                title: "Operational Sustainability Signals",
                text:
                    "Highlights long-term financial health indicators to support confident planning and growth decisions."
            }
        ],
        footer:
            "These insights help leadership maintain financial stability, improve profitability, and make proactive data-driven decisions."
    }
    ,

    "Smart Rostering": {
        title: "Smart Rostering Insights",
        points: [
            {
                title: "100% Shift Coverage",
                text:
                    "Automatically identifies unallocated or at-risk shifts and recommends the best staff to ensure no shift is missed."
            },
            {
                title: "Best Staff Match",
                text:
                    "Matches client care needs with staff skills, availability, compliance, and past shift history."
            },
            {
                title: "Cost-Optimised Rostering",
                text:
                    "Considers hourly rates, overtime risk, travel distance, and utilisation to suggest the most cost-efficient staff."
            },
            {
                title: "Overtime & Fatigue Control",
                text:
                    "Analyses overtime patterns and staff workload to prevent burnout and ensure fair rostering."
            },
            {
                title: "Instant SMS & Allocation Readiness",
                text:
                    "Prepares rosters that can be instantly actioned via SMS invites or scheduling systems."
            },
            {
                title: "Manual & File-Based Rostering",
                text:
                    "Supports both uploaded roster files and natural-language prompts for flexible rostering scenarios."
            }
        ]
    }
    ,
    "Clients Profitability": {
        title: "Client Profitability Insights",
        points: [
            {
                title: "Client Margin Analysis",
                text:
                    "Calculates profit and margin for each client by comparing revenue against allocated service and labour costs."
            },
            {
                title: "Low & Negative Margin Detection",
                text:
                    "Automatically flags clients and services operating at low or negative margins before they impact overall profitability."
            },
            {
                title: "Revenue vs Cost Breakdown",
                text:
                    "Breaks down revenue and expenses by participant, region, department, and service type for clear cost attribution."
            },
            {
                title: "Funding Utilisation Visibility",
                text:
                    "Identifies underutilised or inefficiently used funding to improve package utilisation and reduce missed revenue."
            },
            {
                title: "Service Line Profitability",
                text:
                    "Highlights which services, programs, or delivery models contribute the most — and least — to profitability."
            },
            {
                title: "Forecasting & Risk Signals",
                text:
                    "Uses historical patterns to predict future margin risks and support proactive pricing or service adjustments."
            }
        ],
        footer:
            "These insights enable finance and operations teams to optimise client mix, protect margins, and drive sustainable growth."
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
