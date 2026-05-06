import React, { useState, useEffect } from "react";
import "../../Styles/general-styles/UploaderPage.css";
import logo from '../../../src/Images/CurkiAiLogo.png';
import BlackExpandIcon from '../../../src/Images/BlackExpandIcon.png';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';
import Modal from "./Modal";
import SignIn from "./SignIn";
import MarkdownParser from "./MarkdownParser";
import { auth, getCount, incrementCount, signOut } from "../../firebase";
import JSZip from "jszip";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FeedbackModal from "./FeedbackModal";
import SummaryReport from "./SummaryReportViewer";
import PricingModal from "./PricingModal";
import SubscriptionStatus from "./SubscriptionStatus";
import { FiUploadCloud } from "react-icons/fi";
import star from '../../Images/star.png';
import { IoMdInformationCircleOutline } from "react-icons/io";
import askAiStar from '../../Images/askaiStar.png';
import purpleStar from '../../Images/PurpleStar.png';
import { RxCrossCircled } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import fileIcon from '../../Images/FileIcon.png';
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
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import TooltipPlaceholder from '../../Images/TooltipPlaceholder.png';
import customPlaceHolder from '../../Images/customPlaceholder.jpeg';
import PricingPlansModal from "./NewPricingModal";


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

        'Care Services & eligibility Analysis': { white: whiteCareplan, purple: purpleCareplan },
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


const UploaderCSVBox = ({ file, setFile, title, removeFile, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        if (disabled) return;
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setLoading(true);
            setTimeout(() => {
                setFile(selectedFile);
                setLoading(false);
            }, 1500);
        }
    };

    return (
        <div className={`uploader-box ${loading ? "loading" : ""} ${disabled ? "disabled" : ""}`}>
            {loading && (
                <div className="loader-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <p className="uploader-title">{title}</p>
            {file && (
                <div className="file-info" >
                    <div className="file-icon">
                        <img src={fileIcon} height={20} width={15} alt="Zip" />
                    </div>
                    <div style={{ fontSize: '15px', fontFamily: 'Inter', fontWeight: '600', textAlign: 'start' }}>{file.name}</div>
                    <div className="remove-btn" onClick={removeFile}>
                        <RiDeleteBin6Line size={20} color="red" />
                    </div>
                </div>
            )}
            <div>
                {!file ?
                    <div className="upload-area">
                        <label
                            htmlFor={`file-upload-${title}`}
                            className="upload-label"
                            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                        >
                            <div className="upload-icon">
                                <FiUploadCloud color="#6C4CDC" />
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', marginBottom: '6px' }}>Drop file or browse</div>
                            <p className="support-text">Format: .xlsx or .csv only</p>
                            <div className="uploaddiv">Browse Files</div>
                            <input
                                type="file"
                                id={`file-upload-${title}`}
                                accept=".xlsx, .csv"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                disabled={disabled || loading}
                            />
                        </label>
                    </div>
                    :
                    <div style={{ marginTop: '16px' }}>
                        <div className="uploaddiv">Browse Files</div>
                        <input
                            type="file"
                            id={`file-upload-${title}`}
                            accept=".xlsx, .csv"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                            disabled={disabled || loading}
                        />
                    </div>
                }
            </div>
        </div>
    );
};
const UploadReports = ({ files, setFiles, title, subtitle, removeFile, fileformat, content, multiple,isProcessing }) => {
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        let selectedFiles = Array.from(e.target.files);
        console.log('Deepak',isProcessing)
        console.log(selectedFiles);
        if (!multiple && selectedFiles.length > 0) {
            // Always replace with the latest uploaded file
            selectedFiles = [selectedFiles[selectedFiles.length - 1]];
            setFiles(selectedFiles);
        }
        else if (selectedFiles.length > 0) {
            setLoading(true);
            setTimeout(() => {
                if (title === "Custom Reporting") {
                    let newFiles = [...files, ...selectedFiles];
    
                    // Only keep the last 2 files
                    if (newFiles.length > 2) {
                        newFiles = newFiles.slice(newFiles.length - 2);
                    }
    
                    setFiles(newFiles);
                } else {
                    setFiles(prev => [...prev, ...selectedFiles]);
                }
                setLoading(false);
            }, 1000);
        }
    };

    return (
        <div className={`uploader-box ${loading ? "loading" : ""}`}>
            {loading && (
                <div className="loader-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '30px' }}>
                <div className="uploader-title" style={{ marginBottom: '0px' }}>{title}</div>
                {(title === 'SIRS Analysis' || title === 'Custom Reporting' || title === 'Care Plan Document' || title === 'Incident Report') &&
                    <Tippy
                        content={<div style={{ width: '450px', height: 'auto', padding: '4px',fontSize:'15px',fontWeight:'600'}}><img src={title === 'Custom Reporting' ? customPlaceHolder : TooltipPlaceholder} alt='tooltip' style={{ width: '100%' }} /> {content}</div>}
                        trigger="mouseenter focus click" // shows on hover or click
                        interactive={true} // allows the tooltip to stay open on click
                        placement="right"
                        theme="custom"
                    >
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <IoMdInformationCircleOutline size={22} color="#5B36E1" />
                        </div>
                    </Tippy>
                }

            </div>

            <div className="files-lists">
                {files.map((file, index) => (
                    <div className="files-infos" key={index}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="file-icon">
                                <img src={fileIcon} height={20} width={15} alt="Zip" />
                            </div>
                            <div style={{ fontSize: '15px', fontFamily: 'Inter', fontWeight: '600', textAlign: 'start' }}>
                                {file.name}
                            </div>
                        </div>
                        <div className="remove-btn" onClick={() => removeFile(index)}>
                            <RiDeleteBin6Line size={20} color="red" />
                        </div>
                    </div>
                ))}
            </div>

            <div>
                {!files.length ? (
                    <div className="upload-area">
                        <label htmlFor={`file-upload-${title}`} className="upload-label">
                            <div className="upload-icon">
                                <FiUploadCloud color="#6C4CDC" />
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', marginBottom: '6px' }}>
                                Drop file or browse
                            </div>
                            <p className="support-text">{subtitle}</p>
                            <div className={`uploaddiv ${isProcessing ? 'disabled' : ''}`}>Browse Files</div>
                            <input
                                type="file"
                                id={`file-upload-${title}`}
                                accept={fileformat}
                                multiple={multiple}
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                disabled={loading || isProcessing}
                            />
                        </label>
                    </div>
                ) : (
                    <div style={{ marginTop: '16px' }}>
                        <label htmlFor={`file-upload-${title}`} className="uploaddiv">
                            Browse Files
                            <input
                                type="file"
                                id={`file-upload-${title}`}
                                accept={fileformat}
                                multiple={multiple}
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                disabled={loading || isProcessing}
                            />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

const UploaderZipBox = ({ file, setFile, title, subtitle, removeFile, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        if (disabled) return; // Prevent uploading if disabled
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setLoading(true);
            setTimeout(() => {
                setFile(selectedFile);
                setLoading(false);
            }, 1500);
        }
    };

    return (
        <div className={`uploader-box ${loading ? "loading" : ""} ${disabled ? "disabled" : ""}`}>
            {loading && (
                <div className="loader-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <p className="uploader-title">{title}</p>
            {file && (
                <div className="file-info" onClick={removeFile}>
                    <div className="file-icon">
                        <img src={fileIcon} height={20} width={15} alt="Zip" />
                    </div>
                    <div style={{ fontSize: '15px', fontFamily: 'Roboto', fontWeight: '600', textAlign: 'start' }}>{file.name}</div>
                    <div className="remove-btn">
                        <RiDeleteBin6Line size={20} color="red" />
                    </div>
                </div>
            )}
            <div>
                {!file ?
                    <div className="upload-area">
                        <label
                            htmlFor={`file-upload-${title}`}
                            className="upload-label"
                            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                        >
                            <div className="upload-icon">
                                <FiUploadCloud color="#6C4CDC" />
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', marginBottom: '6px' }}>Drop file or browse</div>
                            <p className="support-text">Only support zip files</p>
                            <div className="uploaddiv">Browse Files</div>
                            <input
                                type="file"
                                id={`file-upload-${title}`}
                                accept=".zip"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                disabled={disabled || loading}
                            />
                        </label>
                    </div>
                    :
                    <div style={{ marginTop: '16px' }}>
                        <label className="uploaddiv">Browse Files
                            <input
                                type="file"
                                id={`file-upload-${title}`}
                                accept=".zip"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                disabled={disabled || loading}
                            />
                        </label>
                    </div>
                }
            </div>
        </div>
    );
};



const UploaderPage = () => {
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [zipFile1, setZipFIle1] = useState(null);
    const [zipFile2, setZipFIle2] = useState(null);
    const [zipFile3, setZipFIle3] = useState(null);
    const [zipFile4, setZipFIle4] = useState(null);
    const [showReport, setShowReport] = useState(false); // NEW STATE
    const [visualizations, setVisualizations] = useState([]);
    const [documentString, setDocumentString] = useState('');
    const [report, setReport] = useState('');
    const [progress, setProgress] = useState(0);
    const [zipProgress, setZipProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isZipProcessing, setIsZipProcessing] = useState(false);
    const [showFinalZipReport, setShowFinalZipReport] = useState(false);
    const [showAIChat, setShowAIChat] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Financial Health');
    const [reportZipData, setReportZipdata] = useState([])
    const [activeReportType, setActiveReportType] = useState(null);
    const [reportFiles, setReportFiles] = useState([]);
    const [showUploadedReport, setShowUploadReport] = useState(false);
    const [isAnalysingReportLoading, setIsAnalysingReportLoading] = useState(false);
    const [isAnalyseReportProgress, setIsAnalysedReportProgress] = useState(0);
    const [analysedReportdata, setAnalysedReportdata] = useState(null);
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    const [template, setTemplate] = useState(null);
    const [parsedReports, setParsedReports] = useState(null);
    const [majorTypeofReport, setMajorTypeOfReport] = useState('');
    const [mergedExcelFile, setMergedExcelFile] = useState('');
    const [standardExcelFile, setStandardExcelFile] = useState(null);
    const [uploadedExcelFile, setUploadedExcelFile] = useState(null);
    const [incidentdatatoDownload, setIncidentDatatoDownload] = useState([]);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [payRollReport,setPayRollReport]=useState(null);
    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };

    const handleModalOpen = () => {
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
    };
    useEffect(() => {
        getCount();
    }, []);

    // console.log(activeReportType);
    // console.log(selectedRole);

    const isButtonDisabled = !template && reportFiles.length === 0;
    const isZipButtonDisabled = !zipFile1

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };
    useEffect(() => {
        // setActiveReportType("Care Plan Document");
        // setMajorTypeOfReport("SUPPORT AT HOME");
        // setShowUploadReport(true);
        // setShowReport(false);
        // setShowFinalZipReport(false);
        // if (analysedReportdata) setAnalysedReportdata(null);

        // for financial thing to show when other is locked......
        setSelectedRole('Financial Health');
        setShowReport(false);
        setShowFinalZipReport(false);
        if (showUploadedReport) setShowUploadReport(false);
        // ..................

    }, []);



    const handleAnalyse = async () => {
        if (reportFiles.length === 0) {
            alert("Please upload the report files.");
            return;
        }

        handleClick();
        setIsProcessing(true);
        setProgress(1);

        const interval = setInterval(() => {
            setProgress((prev) => (prev < 92 ? prev + 2 : prev));
        }, 5000);

        try {
            if (selectedRole === "Financial Health" || selectedRole === "Quarterly Financial Reporting") {
                let metricMap = {};

                if (selectedRole === "Financial Health") {
                    metricMap = {
                        "Hours Monthly": "hours",
                        "Wages Monthly": "wages",
                        "Income by Service Monthly": "income_by_service",
                        "Claimable per week": "claimables",
                    };
                } else if (selectedRole === "Quarterly Financial Reporting") {
                    metricMap = {
                        "Year to date Financial State_1": "Year to date Financial Statement 1",
                        "Year to date Financial State_2": "Year to date Financial Statement 2",
                        "Year to date Financial Statemen": "Year to date Financial Statement 3",
                        "Resi_CareLabour_Cost&Hours 1_Sh": "Resi_CareLabour_Cost&Hours 1",
                        "Resi_CareLabour_Cost&Hours 2_Sh": "Resi_CareLabour_Cost&Hours 2",
                        "Resi_CareLabour_Cost&Hours 3_Sh": "Resi_CareLabour_Cost&Hours 3",
                        "DGTC - Resi Labour Cost prpd_Sh": "DGTC - Resi Labour Cost prpd",
                        "HC_CareLabour_Cost&Hours 1_Shee": "HC_CareLabour_Cost&Hours 1",
                        "HC_CareLabour_Cost&Hours 2_Shee": "HC_CareLabour_Cost&Hours 2",
                    };
                }
                const getMetricFromSheetName = (sheetName) => {
                    for (let key in metricMap) {
                        if (sheetName.toLowerCase().includes(key.toLowerCase())) {
                            return metricMap[key];
                        }
                    }
                    return "claimables";
                };
                // console.log('MetricMap', metricMap);
                const generateSheetBlob = async (fileOrBlob, sheetName) => {
                    const buffer = await fileOrBlob.arrayBuffer();
                    const wb = XLSX.read(buffer, { type: "array" });
                    const newWb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(newWb, wb.Sheets[sheetName], sheetName);
                    const arrayBuffer = XLSX.write(newWb, { bookType: "xlsx", type: "array" });
                    return new Blob([arrayBuffer], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                };

                const standardFiles = [];
                const uploadedFiles = [];
                let stdTemplatePath = "";

                if (selectedRole === "Financial Health") {
                    stdTemplatePath = "/MonthlyReportTemplate.xlsx";
                } else if (selectedRole === 'Quarterly Financial Reporting') {
                    stdTemplatePath = "/QuarterlyFinancialTemplate.xlsx";
                }
                const stdTemplateResponse = await fetch(stdTemplatePath);
                const stdTemplateBlob = await stdTemplateResponse.blob();
                const stdBuffer = await stdTemplateBlob.arrayBuffer();
                const stdWorkbook = XLSX.read(stdBuffer, { type: "array" });

                for (const sheetName of stdWorkbook.SheetNames) {
                    const metric = getMetricFromSheetName(sheetName);
                    const sheetBlob = await generateSheetBlob(stdTemplateBlob, sheetName);

                    const formData = new FormData();
                    formData.append("template", sheetBlob, `${sheetName}.xlsx`);
                    reportFiles.forEach((file) => formData.append("source_files", file, file.name));
                    formData.append("metric_name", metric);
                    console.log(stdTemplatePath);

                    let standardEndpoint = "";
                    if (selectedRole === "Financial Health") {
                        standardEndpoint = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/header-modules/financial/populate";
                    } else if (selectedRole === "Quarterly Financial Reporting") {
                        // console.log('Deepak');
                        standardEndpoint = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/qfr/populate";
                    }

                    const stdAPIRes = await axios.post(
                        standardEndpoint,
                        formData,
                        { responseType: 'blob' }
                    );
                    const stdFile = new File([stdAPIRes.data], `${sheetName}_Standard_Report.xlsx`, {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    standardFiles.push(stdFile);
                }
                setStandardExcelFile(standardFiles);

                let uploadedExcelFileTemp = null;
                if (template) {
                    const buffer = await template.arrayBuffer();
                    const wb = XLSX.read(buffer, { type: "array" });

                    for (const sheetName of wb.SheetNames) {
                        const metric = getMetricFromSheetName(sheetName);

                        const newWb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(newWb, wb.Sheets[sheetName], sheetName);
                        const sheetBlob = new Blob(
                            [XLSX.write(newWb, { bookType: "xlsx", type: "array" })],
                            { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
                        );

                        const formData = new FormData();
                        formData.append("template", sheetBlob, `${sheetName}.xlsx`);
                        reportFiles.forEach((file) => formData.append("files", file, file.name));
                        formData.append("context", "None");

                        const uploadRes = await axios.post(
                            "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/financial_reporting",
                            formData
                        );

                        const base64Data = uploadRes.data?.file_base64;
                        if (base64Data) {
                            const binary = atob(base64Data.split(",")[1] || base64Data);
                            const byteArray = new Uint8Array(binary.length);
                            for (let i = 0; i < binary.length; i++) {
                                byteArray[i] = binary.charCodeAt(i);
                            }
                            const blob = new Blob([byteArray], {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            });
                            const uploadedFile = new File([blob], `${sheetName}_Uploaded_Report.xlsx`, {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            });
                            uploadedFiles.push(uploadedFile);
                            uploadedExcelFileTemp = uploadedFile;
                        }
                    }
                    setUploadedExcelFile(uploadedExcelFileTemp);
                }

                const mergedWorkbook = XLSX.utils.book_new();
                let sheetCounter = 1;
                const appendSheets = async (file, label) => {
                    const buffer = await file.arrayBuffer();
                    const wb = XLSX.read(buffer, { type: "array" });

                    const sanitize = (name) => name.replace(/[:\\/?*\[\]]/g, '');
                    const maxSheetNameLength = 31;

                    wb.SheetNames.forEach((sheet) => {
                        const baseName = sanitize(`${label}_${sheet}`);
                        const truncatedBaseName = baseName.substring(0, maxSheetNameLength - 5); // Reserve space for counter
                        const safeSheetName = `${truncatedBaseName}_${sheetCounter++}`;
                        XLSX.utils.book_append_sheet(mergedWorkbook, wb.Sheets[sheet], safeSheetName);
                    });
                };
                for (const stdFile of standardFiles) await appendSheets(stdFile, "Standard");
                for (const upFile of uploadedFiles) await appendSheets(upFile, "Uploaded");

                const mergedBlob = new Blob(
                    [XLSX.write(mergedWorkbook, { bookType: "xlsx", type: "array" })],
                    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
                );
                const mergedFile = new File([mergedBlob], "merged_report.xlsx", {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });

                const summariseForm = new FormData();
                summariseForm.append("file", mergedFile);
                console.log('SuumariseFor', summariseForm);
                let standardSummariseEndpoint = '';
                if (selectedRole === "Financial Health") {
                    standardSummariseEndpoint = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/header-modules/financial/report";
                } else if (selectedRole === "Quarterly Financial Reporting") {
                    // console.log('Deepak');
                    standardSummariseEndpoint = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/qfr/report";
                }
                const summaryResponse = await axios.post(
                    standardSummariseEndpoint,
                    summariseForm
                );
                console.log('DeepakAnalyis', summaryResponse);
                setReport(summaryResponse.data?.analysis || "No summary available.");

                // Visualisation only for Financial Health
                const visualiseForm = new FormData();
                visualiseForm.append("file", mergedFile);
                const expectedMetrics = [
                    "Hours of Service Delivered",
                    "Wages Plotting",
                    "Income Plotting",
                    "Services Plotting"
                ];

                try {
                    let standardVisulaiseEndpoint = '';
                    if (selectedRole === "Financial Health") {
                        standardVisulaiseEndpoint = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/header-modules/financial/visualise";
                    } else if (selectedRole === "Quarterly Financial Reporting") {
                        // console.log('Deepak');
                        standardVisulaiseEndpoint = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/qfr/visualise ";
                    }
                    const visualiseResponse = await axios.post(
                        standardVisulaiseEndpoint,
                        visualiseForm
                    );
                    console.log(visualiseResponse);
                    const attachments = visualiseResponse.data?.attachments || [];

                    if (attachments.length > 0) {
                        const uniqueAttachments = attachments.filter((att, index, self) =>
                            index === self.findIndex(a => a.file_base64 === att.file_base64)
                        );

                        const visuals = uniqueAttachments.map((att) => {
                            const base64 = att.file_base64.startsWith("data:")
                                ? att.file_base64
                                : `data:image/png;base64,${att.file_base64}`;
                            return { image: base64 };
                        });
                        setVisualizations(visuals);
                    } else {
                        setVisualizations(expectedMetrics.map(metric => ({ metricName: metric, image: "/GraphPlacholder.png" })));
                    }
                } catch (visualError) {
                    console.error("Visualisation Error:", visualError);
                    setVisualizations(expectedMetrics.map(metric => ({ metricName: metric, image: "/GraphPlacholder.png" })));
                }
                clearInterval(interval);
                setProgress(100);
                setTimeout(() => {
                    setShowReport(true);
                    setIsProcessing(false);
                }, 500);

            } else if (selectedRole === "SIRS Analysis") {
                const file = reportFiles[0];
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: "array" });
                const firstSheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                const headers = rows[0];
                const dataRows = rows.slice(1); // Remove header row

                const allResults = [];

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    const rowDict = {};
                    headers.forEach((key, index) => rowDict[key] = row[index]);

                    try {
                        const sirsResponse = await axios.post(
                            "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/sirs/analyze",
                            { input_row: rowDict }
                        );

                        const result = sirsResponse.data;
                        allResults.push(result);

                        if (i === 0) {
                            // Show the first result immediately
                            setReport([result]);
                            setVisualizations([]);
                            setProgress(100);
                            setTimeout(() => {
                                setShowReport(true);
                                setIsProcessing(false);
                            }, 500);
                        } else {
                            // Append later results in background
                            setReport(prev => [...prev, result]);
                        }

                    } catch (error) {
                        console.error(`Error processing row ${i + 1}`, error);
                    }
                }
                clearInterval(interval);
            } else if (selectedRole === 'Custom Reporting') {
                console.log('doing custom Reporting.......');
                try {
                    const payrollForm = new FormData();
                    reportFiles.forEach((file, index) => {
                        payrollForm.append(`source${index + 1}`, file, file.name);
                    });

                    const payrollResponse = await axios.post(
                        "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/custom-reporting/tlc/payroll",
                        payrollForm,
                        { responseType: 'blob' }
                    );
                    
                    console.log('payrollResponse',payrollResponse);
                    const payrollBlob = new Blob([payrollResponse.data], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });

                    const payrollFile = new File([payrollBlob], "payroll_final_report.xlsx", {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    setPayRollReport(payrollFile);

                    console.log(payrollFile);

                    // Step 2: Summary API
                    const summaryForm = new FormData();
                    summaryForm.append("file", payrollFile);

                    const summaryResponse = await axios.post(
                        "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/custom-reporting/tlc/payroll_summary",
                        summaryForm
                    );

                    const summaryText = summaryResponse.data || "No summary available.";
                    // console.log('SummaryText',summaryText);
                    setReport(summaryText);
                    setVisualizations([]);
                    setProgress(100);

                    setTimeout(() => {
                        setShowReport(true);
                        setIsProcessing(false);
                    }, 500);
                } catch (error) {
                    console.error("Custom Reporting Error:", error);
                    alert("Custom Reporting failed. Please check your files or try again.");
                    clearInterval(interval);
                    setProgress(0);
                    setIsProcessing(false);
                }
            } else {
                alert("Selected module not supported yet.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("AI Overloading or network issue.");
            clearInterval(interval);
            setProgress(0);
            setIsProcessing(false);
        }
    };



    const handleDownloadUploadedExcel = () => {
        if (!uploadedExcelFile) {
            alert("No Uploaded Excel file to download.");
            return;
        }

        const url = URL.createObjectURL(uploadedExcelFile);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", uploadedExcelFile.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };


    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
    }

    const handledownloadPayrollFile = () => {
        const url = URL.createObjectURL(payRollReport);
    
        const link = document.createElement("a");
        link.href = url;
        link.download = payRollReport.name;
        document.body.appendChild(link);
        link.click();
    
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    

    const handleDownloadStandardExcel = async () => {
        if (!Array.isArray(standardExcelFile) || standardExcelFile.length === 0) {
            alert("No Standard Excel files to download.");
            return;
        }

        const mergedWorkbook = XLSX.utils.book_new();
        const usedSheetNames = new Set();

        for (const file of standardExcelFile) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Get base name without extension and limit to 31 characters
            const rawName = file.name.replace(/\.xlsx$/i, "");
            let sheetName = rawName.slice(0, 31); // Truncate to 31 chars

            // Ensure uniqueness if names clash
            let counter = 1;
            while (usedSheetNames.has(sheetName)) {
                const suffix = `_${counter++}`;
                const base = rawName.slice(0, 31 - suffix.length);
                sheetName = base + suffix;
            }

            usedSheetNames.add(sheetName);
            XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, sheetName);
        }

        const wbout = XLSX.write(mergedWorkbook, { bookType: "xlsx", type: "binary" });
        const blob = new Blob([s2ab(wbout)], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Combined_Standard_Report.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };




    const handleGenerate = async () => {
        if (!zipFile1) {
            alert("Please upload a zip file");
            return;
        }
        handleClick();
        setIsZipProcessing(true);
        setZipProgress(0);
        setShowFinalZipReport(false);
        const allResponses = [];

        let virtualProgress = 0;
        let virtualProgressInterval;

        // Start virtual progress
        const startVirtualProgress = () => {
            virtualProgressInterval = setInterval(() => {
                virtualProgress += Math.random() * 3 + 1; // Random progress step
                if (virtualProgress >= 99) {
                    virtualProgress = 99;
                    clearInterval(virtualProgressInterval);
                }
                setZipProgress(Math.floor(virtualProgress));
            }, 6000); // Every 200ms
        };

        try {
            startVirtualProgress();

            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(zipFile1);

            const pdfFiles = Object.keys(loadedZip.files).filter((fileName) =>
                fileName.endsWith(".pdf")
            );

            for (const fileName of pdfFiles) {
                const fileData = await loadedZip.files[fileName].async("blob");

                const formData = new FormData();
                formData.append("file", fileData, fileName);

                try {
                    const response = await axios.post(
                        "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/incident-reporting-dca/report",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );

                    if (response?.data?.data) {
                        allResponses.push(...response.data.data);
                    } else {
                        allResponses.push({ file: fileName, error: "No data in response" });
                    }
                } catch (error) {
                    allResponses.push({
                        file: fileName,
                        error: error?.response?.data?.error || error.message,
                    });
                }
                console.log(allResponses)
            }

            // Set progress to 100% when complete
            clearInterval(virtualProgressInterval);
            setZipProgress(100);

            setReportZipdata(allResponses);
            setShowFinalZipReport(true);
        } catch (error) {
            console.error("Error processing ZIP:", error);
            alert("Failed to process the ZIP file.");
        } finally {
            setIsZipProcessing(false);
        }
    };

    const handleAnalyseReports = async () => {
        if (reportFiles.length === 0) {
            alert("Please upload a file.");
            return;
        }

        handleClick();

        let progressInterval;
        try {
            setIsAnalysingReportLoading(true);
            setIsAnalysedReportProgress(1);

            // Start virtual progress
            progressInterval = setInterval(() => {
                setIsAnalysedReportProgress(prev => (prev < 90 ? prev + 4 : prev));
            }, 4000);

            if (activeReportType === "Care Plan Document") {
                const file = reportFiles[0];
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: "array" });
                const firstSheet = wb.Sheets[wb.SheetNames[0]];
                const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                const headers = sheetData[0];
                const dataRows = sheetData.slice(1); // skip header row

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    const rowDict = {};
                    headers.forEach((key, index) => {
                        rowDict[key] = row[index];
                    });

                    try {
                        const response = await axios.post(
                            "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/header-modules/care-plan-analysis/analyze",
                            { input_row: rowDict }
                        );

                        if (response.status === 200) {
                            const result = response.data;
                            setAnalysedReportdata(prev => [...(prev || []), result]);
                            setDocumentString(null);
                            setParsedReports(null);

                            // ✅ First row: show UI and stop loading/progress
                            if (i === 0) {
                                clearInterval(progressInterval);
                                setIsAnalysedReportProgress(100);
                                setIsAnalysingReportLoading(false);
                            }
                        }
                    } catch (err) {
                        console.error(`Error analyzing row ${i + 1}:`, err);

                        if (i === 0) {
                            clearInterval(progressInterval);
                            setIsAnalysingReportLoading(false);
                            alert("Error analyzing first row.");
                        }
                    }
                }
            } else if (activeReportType === "Incident Report") {
                const file = reportFiles[0];
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: "array" });
                const firstSheet = wb.Sheets[wb.SheetNames[0]];
                const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                const allResponsedata = [];

                const headers = sheetData[0];
                const dataRows = sheetData.slice(1); // skip header row

                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    const rowDict = {};
                    headers.forEach((key, index) => {
                        rowDict[key] = row[index];
                    });

                    try {
                        const response = await axios.post(
                            "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/incident",
                            { file_type: "row", row: rowDict }
                        );
                        if (response?.data?.data) {
                            allResponsedata.push(response?.data?.data);
                        }
                        if (response.status === 200) {
                            const result = response.data;
                            setAnalysedReportdata(prev => [...(prev || []), result]);
                            setDocumentString(null);
                            setParsedReports(null);

                            // ✅ First row: show UI and stop loading/progress
                            if (i === 0) {
                                clearInterval(progressInterval);
                                setIsAnalysedReportProgress(100);
                                setIsAnalysingReportLoading(false);
                            }
                        }
                    } catch (err) {
                        console.error(`Error analyzing row ${i + 1}:`, err);

                        if (i === 0) {
                            clearInterval(progressInterval);
                            setIsAnalysingReportLoading(false);
                            alert("Error analyzing first row.");
                        }
                    }
                }
                setIncidentDatatoDownload(allResponsedata);
                setShowDownloadButton(true);
            } else if (activeReportType === 'Quality and Risk Reporting') {
                const formData = new FormData();
                reportFiles.forEach(file => {
                    formData.append("files", file);
                });

                const response = await axios.post(
                    "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/quality-risk/report",
                    formData,
                );

                console.log('reponse', response);

                if (response.status === 200 && response.data?.report) {
                    const allReports = response.data.report;
                    setAnalysedReportdata(allReports);
                    setDocumentString(null);
                    setParsedReports(null);

                    // ✅ First response triggers UI change
                    clearInterval(progressInterval);
                    setIsAnalysedReportProgress(100);
                    setIsAnalysingReportLoading(false);
                } else {
                    throw new Error("No report data found.");
                }
            } else {
                alert("Selected module not supported yet.");
                clearInterval(progressInterval);
                setIsAnalysingReportLoading(false);
            }
        } catch (error) {
            console.error("Unexpected Error:", error);
            alert("Something went wrong while analyzing the report.");
            clearInterval(progressInterval);
            setIsAnalysingReportLoading(false);
        }
    };

    // console.log('AnalysedReportData', analysedReportdata);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Add user message to chat
        setMessages(prevMessages => [
            ...prevMessages,
            { sender: "user", text: input }
        ]);

        // Prepare payload
        const payload = {
            query: input
        };

        if (documentString) {
            payload.document = documentString;
        }

        try {
            const response = await axios.post(
                'https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/askai',
                payload
            );

            console.log("API Response:", response.data);

            const botReply = response.data?.response?.text || response.data?.response || "No response from server.";

            setMessages(prevMessages => [
                ...prevMessages,
                { sender: "bot", text: botReply }
            ]);

        } catch (error) {
            console.error("Error calling API:", error);

            setMessages(prevMessages => [
                ...prevMessages,
                { sender: "bot", text: "Sorry, something went wrong!" }
            ]);
        }

        setInput('');
    };


    const handleDownloadCSV = () => {
        if (!Array.isArray(reportZipData) || reportZipData?.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(reportZipData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, 'Incident_Management_Report.csv');
    };
    const handleDownloadIncidentReportCSV = () => {
        if (!Array.isArray(incidentdatatoDownload) || incidentdatatoDownload?.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(incidentdatatoDownload);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, 'Incident_Report.csv');
    };
    const handleDownloadAnalyedReportCSV = () => {
        if (!parsedReports || !Array.isArray(parsedReports.data)) return;

        const incidentsArray = parsedReports.data; // ✅ Directly use the array
        const worksheet = XLSX.utils.json_to_sheet(incidentsArray);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, 'completed_template.csv');
    };
    const handleClick = async () => {
        await incrementCount();
    };

    // console.log(template);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setShowSignIn(false); // Ensure sign-in doesn't show if user exists
            } else {
                setShowSignIn(true);
            }
        });

        return () => unsubscribe(); // Cleanup function
    }, []);


    useEffect(() => {
        if (analysedReportdata || (report && showReport)) {
            const timer = setTimeout(() => {
                setShowFeedbackPopup(true);
                // console.log('Deepak')
            }, 60000); // 1 minute

            return () => clearTimeout(timer);
        }
    }, [analysedReportdata, showReport])


    // Handle Logout
    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setShowDropdown(false);
    };

    SubscriptionStatus(user, setShowPricingModal);

    // console.log(showPricingModal);
    // console.log(showUploadedReport);
    // console.log(report)
    // console.log('showData',incidentdatatoDownload);
    // console.log(user);

    return (
        <>
            {showPricingModal === true ?
                <PricingPlansModal onClose={() => setShowPricingModal(false)} email={user?.email} />
                :
                <div className="page-container">
                    {sidebarVisible ? (
                        <Sidebar onCollapse={toggleSidebar} selectedRole={selectedRole} setSelectedRole={setSelectedRole} showReport={showReport} setShowReport={setShowReport} showFinalZipReport={showFinalZipReport} setShowFinalZipReport={setShowFinalZipReport} showUploadedReport={showUploadedReport} setShowUploadReport={setShowUploadReport} activeReportType={activeReportType} setActiveReportType={setActiveReportType} analysedReportdata={analysedReportdata} setAnalysedReportdata={setAnalysedReportdata} majorTypeofReport={majorTypeofReport} setMajorTypeOfReport={setMajorTypeOfReport} setReportFiles={setReportFiles} user={user} handleLogout={handleLogout} setShowDropdown={setShowDropdown} setShowSignIn={setShowSignIn} showDropdown={showDropdown} />
                    ) : (
                        <div className="collapsed-button" onClick={toggleSidebar}>
                            <img src={BlackExpandIcon} height={27} width={28} alt="blackexpand" />
                        </div>
                    )}
                    <div style={{ flex: 1, height: '100vh', overflowY: 'auto', }}>
                        <SignIn show={showSignIn} onClose={() => setShowSignIn(false)} />
                        <div className="typeofreportmaindiv" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', borderBottom: '1px solid #E8ECEF', backgroundColor: 'white' }} >
                            <div className="page-title-btn" onClick={handleModalOpen}>
                                <IoMdInformationCircleOutline size={20} color="#5B36E1" />
                                Accepted Types Of Reports
                            </div>
                        </div>
                        <div className="main-content" style={{ padding: showReport && '8px 10% 40px 10%', flex: 1 }}>
                            {/* {showFeedbackPopup && <FeedbackModal userEmail={user?.email} />} */}
                            {showUploadedReport && activeReportType && (
                                <>
                                    {!analysedReportdata ? (
                                        <>
                                            <div className="selectedModule">{activeReportType}</div>
                                            <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                                            <div
                                                className="uploader-grid"
                                                style={
                                                    activeReportType === "Care Plan Document" || activeReportType === "HR Document" || activeReportType === "Incident Report" || activeReportType === 'Quality and Risk Reporting'
                                                        ? { display: 'flex', justifyContent: 'center' }
                                                        : {}
                                                }
                                            >
                                                {activeReportType !== "Care Plan Document" && activeReportType !== "HR Document" && activeReportType !== 'Incident Report' && activeReportType !== 'Quality and Risk Reporting' && (
                                                    <UploaderCSVBox
                                                        file={template}
                                                        setFile={setTemplate}
                                                        title="Upload Your Template To Be Filled"
                                                        subtitle=".XLSX Format Only"
                                                        removeFile={() => setTemplate(null)}
                                                    />
                                                )}

                                                <div
                                                    style={
                                                        activeReportType === "Care Plan Document" || activeReportType === "HR Document" || activeReportType === "Incident Report" || activeReportType === 'Quality and Risk Reporting'
                                                            ? { width: '50%' }
                                                            : { width: '100%' }
                                                    }
                                                >
                                                    <UploadReports
                                                        files={reportFiles}
                                                        setFiles={setReportFiles}
                                                        title={activeReportType}
                                                        subtitle={
                                                            activeReportType === "Quality and Risk Reporting"
                                                                ? "Upload multiple .xlsx, .csv or .xls files"
                                                                : activeReportType === "Care Plan Document" || activeReportType === "Incident Report"
                                                                    ? "Upload a single .xlsx, .csv or .xls file"
                                                                    : activeReportType === "HR Document"
                                                                        ? "Upload reports in ZIP format"
                                                                        : "Upload reports in ZIP, PDF, XLSX or DOCX format"
                                                        }
                                                        fileformat={
                                                            activeReportType === "Care Plan Document" || activeReportType === "Incident Report" || activeReportType === 'Quality and Risk Reporting'
                                                                ? ".xlsx,.csv,.xls"
                                                                : activeReportType === "HR Document"
                                                                    ? ".zip"
                                                                    : ".zip, .pdf, .docx, .xlsx"
                                                        }
                                                        removeFile={(index) => {
                                                            setReportFiles(prev => prev.filter((_, i) => i !== index));
                                                        }}
                                                        content='Each individual row of the Excel/CSV sheet should represent  a single clients information'
                                                        multiple={activeReportType === 'Quality and Risk Reporting'}
                                                        isProcessing={isAnalysingReportLoading}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                className="analyse-btn"
                                                disabled={isAnalysingReportLoading}
                                                style={{ backgroundColor: '#000', marginTop: '20px' }}
                                                onClick={handleAnalyseReports}
                                            >
                                                {isAnalysingReportLoading
                                                    ? `Analysing... ${isAnalyseReportProgress}%`
                                                    : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                                            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                                                <SummaryReport summaryText={analysedReportdata} selectedRole={activeReportType} showDownloadButton={showDownloadButton} handleDownloadAnalyedReportCSV={handleDownloadAnalyedReportCSV} handleDownloadIncidentReportCSV={handleDownloadIncidentReportCSV} />
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', fontSize: '13px', color: 'grey' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                                        <input type="checkbox" id="aiConsent" checked={isConsentChecked} readOnly style={{ width: '16px', height: '16px', marginRight: '8px', accentColor: 'green', cursor: 'pointer' }} />
                                                        <label htmlFor="aiConsent" style={{ cursor: 'pointer' }}>
                                                            AI-generated content. Only to be used as a guide. I agree to T&C on curki.ai website.
                                                        </label>
                                                    </div>
                                                    <button onClick={handleButtonClick} style={{ background: 'linear-gradient(180deg, rgba(139, 117, 255, 0.9) 27.88%, #6D51FF 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        I understand
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </>
                            )}



                            {(!showReport && !showFinalZipReport && !showUploadedReport) ? (
                                <>
                                    <div className="selectedModule">{selectedRole}</div>
                                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                                    {['Financial Health', 'SIRS Analysis', 'Quarterly Financial Reporting', 'Annual Financial Reporting', 'Custom Reporting'].includes(selectedRole) ? (
                                        <div>
                                            <div className="uploader-grid"
                                                style={
                                                    (selectedRole === "Financial Health" || selectedRole === "Quarterly Financial Reporting")
                                                        ? {}
                                                        : { display: 'flex', justifyContent: 'center' }
                                                }>
                                                {(selectedRole === "Financial Health" || selectedRole === "Quarterly Financial Reporting") && (
                                                    <UploaderCSVBox
                                                        file={template}
                                                        setFile={setTemplate}
                                                        title="Upload Your Template To Be Filled"
                                                        subtitle=".XLSX or .CSV Format Only"
                                                        removeFile={() => setTemplate(null)}
                                                        disabled={true}
                                                    />
                                                )}
                                                <div
                                                    style={
                                                        (selectedRole === "Financial Health" || selectedRole === "Quarterly Financial Reporting")
                                                            ? { width: '100%' }
                                                            : { width: '50%' }
                                                    }
                                                >
                                                    <UploadReports
                                                        files={reportFiles}
                                                        setFiles={setReportFiles}
                                                        title={selectedRole}
                                                        subtitle={
                                                            selectedRole === 'SIRS Analysis'
                                                                ? 'Upload a single .xlsx, .csv or .xls file'
                                                                : 'Upload multiple .xlsx, .csv or .xls files'
                                                        }
                                                        fileformat=".xlsx, .csv, .xls"
                                                        removeFile={(index) => {
                                                            setReportFiles(prev => prev.filter((_, i) => i !== index));
                                                        }}
                                                        content={selectedRole === 'Custom Reporting'
                                                            ? "The file must contain metadata in the first row and the header in the second row. Metadata in the first row should specify the payroll date."
                                                            : "Each individual row of the Excel/CSV sheet should represent a single client's information."}
                                                        multiple={selectedRole !== 'SIRS Analysis'}
                                                        isProcessing={isProcessing}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="uploader-grid">
                                            <UploaderZipBox
                                                file={zipFile1}
                                                setFile={setZipFIle1}
                                                title="Incident Logs"
                                                subtitle="Upload incident logs"
                                                removeFile={() => setZipFIle1(null)}
                                                disabled={false}
                                            />
                                            <UploaderZipBox
                                                file={zipFile2}
                                                setFile={setZipFIle2}
                                                title="Investigation Reports"
                                                subtitle="Upload reports"
                                                removeFile={() => setZipFIle2(null)}
                                                disabled={true}
                                            />
                                            <UploaderZipBox
                                                file={zipFile3}
                                                setFile={setZipFIle3}
                                                title="Root Cause Analysis"
                                                subtitle="Upload RCA docs"
                                                removeFile={() => setZipFIle3(null)}
                                                disabled={true}
                                            />
                                            <UploaderZipBox
                                                file={zipFile4}
                                                setFile={setZipFIle4}
                                                title="Corrective Actions"
                                                subtitle="Upload action plans"
                                                removeFile={() => setZipFIle4(null)}
                                                disabled={true}
                                            />
                                        </div>
                                    )}

                                    {['Financial Health', 'SIRS Analysis', 'Quarterly Financial Reporting', 'Annual Financial Reporting', 'Custom Reporting'].includes(selectedRole) ? (
                                        <>
                                            <button
                                                className="analyse-btn"
                                                disabled={isButtonDisabled || isProcessing}
                                                style={{
                                                    backgroundColor: isButtonDisabled || isProcessing ? '#A1A1AA' : '#000',
                                                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                                                }}
                                                onClick={handleAnalyse}
                                            >
                                                {isProcessing ? `${progress}% Processing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                                            </button>
                                            <div style={{ fontSize: '12px', color: 'grey', fontFamily: 'Inter', fontWeight: '400', textAlign: 'center', marginTop: '12px' }}>**Estimated Time to Analyse 4 min**</div>
                                        </>
                                    ) : (
                                        <button
                                            className="analyse-btn"
                                            disabled={isZipButtonDisabled || isZipProcessing}
                                            style={{
                                                backgroundColor: isZipButtonDisabled || isZipProcessing ? '#A1A1AA' : '#000',
                                                cursor: isZipProcessing ? 'not-allowed' : 'pointer'
                                            }}
                                            onClick={handleGenerate}
                                        >
                                            {isZipProcessing ? `${zipProgress}% Processing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                                        </button>
                                    )}


                                </>
                            ) : (
                                <>
                                    {showReport && ['Financial Health', 'SIRS Analysis', 'Quarterly Financial Reporting', 'Annual Financial Reporting', 'Custom Reporting'].includes(selectedRole) && (
                                        <>
                                            <div className="card-grid">
                                                {visualizations.map((viz, index) => (
                                                    <div key={index} className="data-card">
                                                        <h4>{viz?.metricName}</h4>
                                                        <img src={viz.image} alt={viz.metricName} style={{ width: "100%" }} />
                                                    </div>
                                                ))}
                                            </div>


                                            <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                                                <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                                                    <SummaryReport summaryText={report} handleDownloadAnalyedReportUploadedCSV={handleDownloadUploadedExcel} handleDownloadAnalyedStandardReportCSV={handleDownloadStandardExcel} handledownloadPayrollFile={handledownloadPayrollFile} selectedRole={selectedRole} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', fontSize: '13px', color: 'grey' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                                            <input type="checkbox" id="aiConsent" checked={isConsentChecked} readOnly style={{ width: '16px', height: '16px', marginRight: '8px', accentColor: 'green', cursor: 'pointer' }} />
                                                            <label htmlFor="aiConsent" style={{ cursor: 'pointer' }}>
                                                                AI-generated content. Only to be used as a guide. I agree to T&C on curki.ai website.
                                                            </label>
                                                        </div>
                                                        <button onClick={handleButtonClick} style={{ background: 'linear-gradient(180deg, rgba(139, 117, 255, 0.9) 27.88%, #6D51FF 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                                            I understand
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {(showFinalZipReport && selectedRole === 'Incident Management') && (
                                        <div className="reports-box" style={{ height: 'auto' }}>
                                            <h2 style={{ marginBottom: '14px' }}>Summary Report</h2>

                                            {Array.isArray(reportZipData) && reportZipData?.length > 0 && (
                                                <ul style={{ marginLeft: '20px', marginRight: '20px' }}>
                                                    {Object.entries(reportZipData[0]).map(([key, value]) => (
                                                        <li key={key} style={{ marginBottom: '4px' }}>
                                                            <strong>{key}:</strong> {String(value)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <p style={{ textAlign: 'center', marginTop: '20px', fontWeight: 'bold', fontSize: '20px' }}>Click below to download Full Report</p>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '10px' }}>
                                                <button className="download-btn" style={{ padding: '14px', background: 'linear-gradient(180deg, rgba(139, 117, 255, 0.9) 27.88%, #6D51FF 100%)', color: 'white', border: 'none', outline: 'none', borderRadius: '12px', fontSize: '18px', cursor: 'pointer' }} onClick={handleDownloadCSV}>
                                                    Download Excel Report
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', fontSize: '13px', color: 'grey' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                                    <input type="checkbox" id="aiConsent" checked={isConsentChecked} readOnly style={{ width: '16px', height: '16px', marginRight: '8px', accentColor: 'green', cursor: 'pointer' }} />
                                                    <label htmlFor="aiConsent" style={{ cursor: 'pointer' }}>
                                                        AI-generated content. Only to be used as a guide. I agree to T&C on curki.ai website.
                                                    </label>
                                                </div>
                                                <button onClick={handleButtonClick} style={{ background: 'linear-gradient(180deg, rgba(139, 117, 255, 0.9) 27.88%, #6D51FF 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    I understand
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </>
                            )}
                            <Modal isVisible={isModalVisible} onClose={handleModalClose}>
                            </Modal>
                            <div className="ask-ai-button" onClick={() => setShowAIChat(!showAIChat)}>
                                <img src={askAiStar} alt='askAiStar' style={{ width: '22px', height: '22px' }} />
                                <div style={{ fontFamily: 'Inter', fontSize: '16px', color: 'white' }}>Ask AI</div>
                            </div>

                            {showAIChat && (
                                <div style={{ position: 'fixed', bottom: '100px', right: '30px', width: '350px', height: '400px', backgroundColor: '#000', borderRadius: '10px', boxShadow: '0px 4px 12px rgba(0,0,0,0.2)', zIndex: 999, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: 'white', borderTopRightRadius: '10px', borderTopLeftRadius: '10px', padding: '12px 8px' }}>
                                        <div style={{ display: 'flex', gap: '10px', marginLeft: '20px', alignItems: 'center' }}>
                                            <img src={purpleStar} alt='purple star' style={{ width: '24px', height: '24px' }} />
                                            <div style={{ fontSize: '12px', fontFamily: 'Inter' }}>I can help with Support at Home, NDIS, compliance and reporting</div>
                                        </div>
                                        {/* <button  style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', color: '#000', marginTop: '-4px' }}>×</button> */}
                                        <RxCrossCircled size={24} color="#4A4A4A" onClick={() => setShowAIChat(false)} style={{ cursor: 'pointer' }} />
                                    </div>

                                    <div style={{ flex: 1, marginTop: '10px', overflowY: 'auto', padding: '10px' }}>
                                        {messages.map((msg, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                                                <div style={{ backgroundColor: msg.sender === 'user' ? '#fff' : '#6C4CDC', padding: '10px', borderRadius: '10px', maxWidth: '75%', fontSize: '14px', textAlign: 'left', color: msg.sender === 'user' ? 'black' : 'white', fontFamily: 'Inter' }}>
                                                    <MarkdownParser text={msg.text} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ position: 'relative', marginTop: '10px', marginBottom: '16px', width: '75%', display: 'flex', alignSelf: 'center' }}>
                                        <input type="text" placeholder="Type your question..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} style={{ width: '100%', padding: '8px 40px 8px 8px', borderRadius: '10px', border: '1px solid #ccc' }} />
                                        <FaPaperPlane onClick={handleSend} size={18} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6C4CDC' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
        </>
    );
};

export default UploaderPage;
