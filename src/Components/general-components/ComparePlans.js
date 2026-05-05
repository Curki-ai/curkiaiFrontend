import React from "react";
import "../../Styles/general-styles/ComparePlans.css";

import CustomIcon from "../../Images/Custom.png";
import AgedCareNdisIcon from "../../Images/AgedCareNdis.png";
import NdisIcon from "../../Images/Ndis.png";
import AutomationIcon from "../../Images/Automation.png";
import ComplianceIcon from "../../Images/Compliance.png";
import AiClickedIcon from "../../Images/AiClicked.png";
import AskAiIcon from "../../Images/AskAi.png";
import PayAsYouGoIcon from "../../Images/PayAsYouGo.png";
import XeroIcon from "../../Images/CompareXeroIcon.png";
import ComparePriceTick from "../../Images/ComparePriceTick.png";
import ComparePriceCross from "../../Images/ComparePriceCross.png"
const ComparePlans = () => {
    return (
        <div className="compare-wrapper">
            {/* HEADER */}
            <div className="compare-header">
                <div className="feature-col">
                    {/* <div className="icon-placeholder"></div> */}
                    <span className="header-feature-text">Features</span>
                </div>
                <div className="plan-col" style={{color:"black", fontWeight:500, fontSize:"17px"}}>Profit Lift Starter</div>
                <div className="plan-col" style={{color:"black", fontWeight:500, fontSize:"17px"}}>Margin Starter</div>
                <div className="plan-col" style={{color:"black", fontWeight:500, fontSize:"17px"}}>Margin Pilot - Growth</div>
                <div className="plan-col" style={{color:"black", fontWeight:500, fontSize:"17px"}}>Profit with Compliance - Pro</div>
            </div>

            {/* DESCRIPTION */}
            <div className="desc-row">
                <div className="feature-col" />
                <div className="plan-col">
                    CFO-grade dashboard: margin drivers, cash impact, and actions to stop leaks
                </div>
                <div className="plan-col">
                    Lift EBITDA, reduce OT, vacancy drag
                </div>
                <div className="plan-col">
                    Lift EBITDA, reduce OT, vacancy drag, compliance-safe onboarding within Minutes
                </div>
                <div className="plan-col">
                    CFO-grade finance + AI ops + compliance pack
                </div>
            </div>

            {/* CUSTOM */}
            <Row
                icon={CustomIcon}
                label="Custom"
                values={["×", "×", "×", "×"]}
                divider
                alignWithDesc
            />

            {/* ZERO IT */}
            <Row
                icon={XeroIcon}
                label="Zero IT Transformation Cost"
                subLabel="Connects to your existing systems (ShiftCare, Xero, AlayaCare) in minutes — no IT changes required"
                values={["✓", "✓", "✓", "✓"]}
                divider
            />

            {/* AGED CARE / NDIS */}
            <SectionHeader icon={AgedCareNdisIcon} title="Aged Care/NDIS" />
            <Row label="Financial Health" values={["✓", "✓", "✓", "✓"]} />
            <Row label="Client Profitability" values={["✓", "✓", "✓", "✓"]} />
            <Row label="Payroll tracking" values={["✓", "✓", "✓", "✓"]} divider />

            {/* NDIS */}
            <SectionHeader icon={NdisIcon} title="NDIS" />
            <Row label="Event & Incident Management" values={["×", "×", "✓", "✓"]} />
            <Row label="Incident Auditing" values={["×", "×", "✓", "✓"]} divider />

            {/* AUTOMATION */}
            <SectionHeader icon={AutomationIcon} title="Automation" />
            <Row label="Smart Rostering" values={["×", "1000 Inc", "1000 Inc", "2000 Inc"]} blue />
            <Row label="Smart Onboarding" values={["×", "×", "✓", "✓"]} divider />

            {/* COMPLIANCE */}
            <SectionHeader icon={ComplianceIcon} title="Compliance" />
            <Row label="Quality & Risk Reporting" values={["×", "×", "×", "✓"]} />
            <Row label="SIRS Analysis" values={["×", "×", "×", "✓"]} />
            <Row label="Incident Report" values={["×", "×", "×", "✓"]} divider />

            {/* AI CLICKS */}
            <Row
                icon={AiClickedIcon}
                label="Number of AI Click Included"
                values={["15", "50", "150", "300"]}
                blue
                subLabel="1 hour of natural language conversations or 15 hours of master-vs-budget review"
                divider
            />

            {/* ASK AI */}
            <Row
                icon={AskAiIcon}
                label="Ask AI - Auto Top Up"
                values={["$49", "$50", "$99", "$299"]}
                blue
                divider
            />

            {/* PAY AS YOU GO */}
            <Row
                icon={PayAsYouGoIcon}
                label="Pay as you go"
                values={["✓", "✓", "✓", "✓"]}
            />
        </div>
    );
};

/* ROW */
const Row = ({ icon, label, subLabel, values, blue, divider, alignWithDesc }) => {
    const isXeroRow = label === "Zero IT Transformation Cost";

    return (
        <div
            className={`compare-row 
        ${divider ? "row-divider" : ""} 
        ${alignWithDesc ? "align-with-desc" : ""}
      `}
        >
            <div className="feature-col feature-col-stack">
                <div className="feature-main">
                    {icon && (
                        <img
                            src={icon}
                            alt=""
                            className={`icon-img`}
                            style={isXeroRow ? { width: "34px", height: "18px" } : {}}
                        />
                    )}
                    <span>{label}</span>
                </div>

                {subLabel && <div className="feature-subtext">{subLabel}</div>}
            </div>

            {values.map((v, i) => (
                <div key={i} className={`plan-col ${blue ? "blue-text" : ""}`}>
                    {v === "✓" ? (
                        <img src={ComparePriceTick} alt="tick" className="compare-icon" />
                    ) : v === "×" ? (
                        <img src={ComparePriceCross} alt="cross" className="compare-icon" />
                    ) : (
                        v
                    )}
                </div>
            ))}

        </div>
    );
};


/* SECTION HEADER */
const SectionHeader = ({ icon, title }) => {
    const needsMarginTop = [
        "Aged Care/NDIS",
        "NDIS",
        "Automation",
        "Compliance",
    ].includes(title);

    return (
        <div className="section-header">
            <div className={`feature-col ${needsMarginTop ? "section-top-space" : ""}`}>
                <div className="feature-main">
                    <div className="icon-wrap">
                        <img src={icon} alt="" className="icon-img" />
                    </div>

                    <span
                        className={`plan-compare-section-title`}
                    >
                        {title}
                    </span>
                </div>
            </div>

            <div className="plan-col" />
            <div className="plan-col" />
            <div className="plan-col" />
            <div className="plan-col" />
        </div>
    );
};



export default ComparePlans;
