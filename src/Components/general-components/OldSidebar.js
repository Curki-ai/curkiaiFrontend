import React, { useState, useEffect } from "react";
import "../../Styles/general-styles/UploaderPage.css";
import logo from '../../../src/Images/CurkiAiLogo.png';
import purpleFinanicial from '../../Images/purple_financial.png';
import whiteFinancial from '../../Images/white_financial.png';
import purpleSirs from '../../Images/purple_sirs.png';
import whiteSirs from '../../Images/white_sirs.png';
import purpleQfr from '../../Images/purple_quarter.png';
import whiteQfr from '../../Images/white_quarter.png';
import purpleAnnual from '../../Images/purple_annual.png';
import whiteAnnual from '../../Images/white_annual.png';
import purpleIncidentManagement from '../../Images/purple_incident.png';
import whiteIncidentManagement from '../../Images/white_incident.png';
import purpleCustom from '../../Images/purple_custom.png';
import whitecustom from '../../Images/white_custom.png';
import purpleCareplan from '../../Images/puple_careplan.png';
import whiteCareplan from '../../Images/white_care.png';
import purpleIncidentReport from '../../Images/purple_incidentReporting.png';
import whiteIncidentReport from '../../Images/white_incidentReporting.png';
import purpleqirs from '../../Images/purple_qirs.png';
import whiteqirs from '../../Images/white_qirs.png';
import lock from '../../Images/lock.png';
import { IoIosContact, IoIosLogOut } from "react-icons/io";
import { FaChevronUp } from "react-icons/fa";

const Sidebar = ({ onCollapse, selectedRole, setSelectedRole, showReport, setShowReport, showFinalZipReport, setShowFinalZipReport, showUploadedReport, setShowUploadReport, activeReportType, setActiveReportType, analysedReportdata, setAnalysedReportdata, majorTypeofReport, setMajorTypeOfReport, setReportFiles, user, handleLogout, setShowSignIn, setShowDropdown, showDropdown }) => {
    // console.log(activeReportType);
    const [showRoles, setShowRoles] = useState(true);
    // const [activeItem, setActiveItem] = useState("Care Services & elgibility Analysis"); careplan
    const [activeItem, setActiveItem] = useState("Financial Health");

    const toggleRoles = () => {
        // setShowRoles(!showRoles);
        setShowUploadReport(false);
    };
    const roles = ['Financial Health', 'SIRS Analysis', 'Quarterly Financial Reporting', 'Annual Financial Reporting', 'Incident Management', 'Custom Reporting'];
    const reportButtons = ["Care Services & eligibility Analysis", "Incident Report", "Quality and Risk Reporting", "HR Analysis"];
    const NDISButton = ["Audit & Registration Manager", "Incident & Complaint Reporter", "Restrictive Practice & Behaviour Support", "Worker-Screening & HR Compliance", "Financial & Claims Compliance", "Participant Outcomes & Capacity-Building"];


    const roleIcons = {
        'Financial Health': { white: whiteFinancial, purple: purpleFinanicial },
        'SIRS Analysis': { white: whiteSirs, purple: purpleSirs },
        'Quarterly Financial Reporting': { white: whiteQfr, purple: purpleQfr },
        'Annual Financial Reporting': { white: whiteAnnual, purple: purpleAnnual },
        'Incident Management': { white: whiteIncidentManagement, purple: purpleIncidentManagement },
        'Custom Reporting': { white: whitecustom, purple: purpleCustom },

        'Care Services & Eligibility Analysis': { white: whiteCareplan, purple: purpleCareplan },
        'Incident Report': { white: whiteIncidentReport, purple: purpleIncidentReport },
        'Quality and Risk Reporting': { white: whiteqirs, purple: purpleqirs },
    };


    return (
        <div className="sidebar">
            <div className="logo" style={{ cursor: 'pointer' }}>
                <img src={logo} style={{ width: '75%', height: 'auto' }} alt='curkiLogo' />
                <div style={{ border: '1px solid #c8c8c8', padding: '4px 8px', borderRadius: '20px', color: '#c8c8c8', marginLeft: '-10px', fontSize: '8px', marginBottom: '-20px', marginTop: '10px' }}>Beta</div>
            </div>
            <div className="sidebar-scroll-content" style={{ overflowY: 'auto', flex: 1 }}>
                {showRoles && (
                    <div className="roles-list">
                        {roles.map(role => {
                            return (
                                <div
                                    key={role}
                                    className={`role-item ${activeItem === role ? 'active-role' : ''}`}
                                    onClick={() => {
                                        setSelectedRole(role);
                                        setActiveItem(role);
                                        setReportFiles([]);
                                        if (showReport) setShowReport(false);
                                        if (showFinalZipReport) setShowFinalZipReport(false);
                                        if (showUploadedReport) setShowUploadReport(false);

                                    }}
                                    style={{ cursor: 'pointer', opacity: 1, marginTop: '2px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img
                                            src={activeItem === role ? roleIcons[role].purple : roleIcons[role].white}
                                            alt={`${role} icon`}
                                            style={{ width: '22px', height: '22px' }}
                                        />
                                        <p>{role}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="roles-list">
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', textAlign: 'left', marginLeft: '30px', fontFamily: 'Roboto', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        SUPPORT AT HOME/ HCP/ CHSP
                    </div>
                    {reportButtons.map(report => {
                        const isEnabled = (report === "Care Services & eligibility Analysis" || report === "Incident Report" || report === 'Quality and Risk Reporting');
                        const icon = roleIcons[report];
                        return (
                            <div
                                key={report}
                                className={`role-item ${activeItem === report ? 'active-role' : ''}`}
                                style={{
                                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                                    marginTop: '2px',
                                    opacity: isEnabled ? 1 : 0.6,
                                    pointerEvents: isEnabled ? 'auto' : 'none',
                                }}
                                onClick={() => {
                                    if (!isEnabled) return;
                                    let reportType = report;
                                    if (report === "HR Analysis") reportType = "HR Document";
                                    else if (report === "Care Services & eligibility Analysis") reportType = "Care Plan Document";
                                    setActiveReportType(reportType);
                                    setActiveItem(report);
                                    setShowReport(false);
                                    setShowFinalZipReport(false);
                                    setReportFiles([]);
                                    setShowUploadReport(true);
                                    setMajorTypeOfReport('SUPPORT AT HOME');
                                    if (analysedReportdata) setAnalysedReportdata(null);
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isEnabled && icon ? (
                                        <img
                                            src={activeItem === report ? icon.purple : icon.white}
                                            alt={`${report} icon`}
                                            style={{ width: '22px', height: '22px' }}
                                        />
                                    ) : (
                                        <img src={lock} alt='lock' style={{ width: '22px', height: '22px' }} />
                                    )}
                                    <p style={{
                                        color: isEnabled
                                            ? (activeItem === report ? '#000000' : '#FFFFFF')
                                            : '#929592'
                                    }}>
                                        {report}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>


                {/* NDIS (Locked) */}
                <div className="roles-list">
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', textAlign: 'left', marginLeft: '30px', fontFamily: 'Roboto', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        NDIS
                        <sup style={{ color: '#C8C8C8', fontSize: '8px', padding: '2px 6px', borderRadius: '999px', border: '1px solid #c8c8c8', fontWeight: 'normal', fontFamily: 'Inter' }}>
                            Coming Soon
                        </sup>
                    </div>

                    {NDISButton.map(report => (
                        <div
                            key={report}
                            className={`role-item ${activeItem === report ? 'active-role' : 'disabled'}`}
                            style={{ cursor: 'not-allowed', marginTop: '2px', opacity: 0.6, pointerEvents: 'none' }}
                            onClick={() => {
                                // Logic is preserved, but click is disabled visually
                                setActiveReportType(report);
                                setActiveItem(report);
                                setShowReport(false);
                                setShowFinalZipReport(false);
                                setShowUploadReport(true);
                                setMajorTypeOfReport('NDIS');
                                if (analysedReportdata) setAnalysedReportdata(null);
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src={lock} alt='lock' style={{ width: '22px', height: '22px' }} />
                                {report}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {showDropdown && (
                        <button onClick={handleLogout} className="logout-button" > <IoIosLogOut size={24} color="#6C4CDC" />Logout</button>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignSelf: 'center', width: '90%', alignItems: 'center', border: '1px solid white', marginBottom: '20px', padding: '11px 14px', borderRadius: '12px', background: '#232627', cursor: 'pointer' }} onClick={() => {
                    if (!user) {
                        setShowSignIn(true);
                    } else {
                        setShowDropdown((prev) => !prev);
                    }
                }}
                >
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <IoIosContact color="white" size={36} />
                        <div>
                            <div style={{ color: '#c8c8c8', fontSize: '14px', textAlign: 'left', fontWeight: 'bold' }}>
                                {user?.displayName}
                            </div>
                            <div style={{ color: '#c8c8c8', fontSize: '12px', textAlign: 'left' }}>
                                {user?.email}
                            </div>
                        </div>
                    </div>
                    <FaChevronUp color="white" size={16} />
                </div>
            </>
        </div>
    );
};
export default Sidebar;