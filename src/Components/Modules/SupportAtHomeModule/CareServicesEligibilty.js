import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import UploadFiles from "../../UploadFiles";
import star from '../../../Images/star.png';
import '../../../Styles/UploaderPage.css';
import SummaryReport from "../../SummaryReportViewer";
import '../../../Styles/UploaderPage.css';
import Toggle from "react-toggle";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { IoMdInformationCircleOutline } from "react-icons/io";
import TooltipPlaceholder from '../../../Images/TooltipPlaceholder.png';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { saveAs } from "file-saver";
const CareServicesEligibility = (props) => {
    const [carePlanreportFiles, setCarePlanReportFiles] = useState([]);
    const [isAnalysingCareReportLoading, setIsAnalysingCareReportLoading] = useState(false);
    const [isAnalysedCareReportProgress, setIsAnalysedCareReportProgress] = useState(0);
    const [analysedCareReportdata, setAnalysedCareReportdata] = useState([]);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [selectedActor, setSelectedActor] = useState("NDIS");
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [startDay, setStartDay] = useState("");
    const [startMonth, setStartMonth] = useState("");
    const [endDay, setEndDay] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [showCarePlanDownloadButton,setShowCarePlanDownloadButton]=useState(false);
    const [careDataToDownload,setCareDatatoDownload]=useState([]);

    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };
    const handleAnalyseReports = async () => {
        if (carePlanreportFiles.length === 0) {
            alert("Please upload a file.");
            return;
        }

        props.handleClick();

        let progressInterval;
        try {
            setIsAnalysingCareReportLoading(true);
            setIsAnalysedCareReportProgress(1);

            // Start virtual progress
            progressInterval = setInterval(() => {
                setIsAnalysedCareReportProgress(prev => (prev < 90 ? prev + 4 : prev));
            }, 4000);

            const file = carePlanreportFiles[0];
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: "array" });
            const firstSheet = wb.Sheets[wb.SheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            const allResponsedatass=[];

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
                    if (response?.data) {
                        allResponsedatass.push(response?.data);
                    }
                    console.log('reponse',response);
                    if (response.status === 200) {
                        const result = response.data;
                        setAnalysedCareReportdata(prev => [...(prev || []), result]);

                        // ✅ First row: show UI and stop loading/progress
                        if (i === 0) {
                            clearInterval(progressInterval);
                            setIsAnalysedCareReportProgress(100);
                            setIsAnalysingCareReportLoading(false);
                        }
                    }
                } catch (err) {
                    console.error(`Error analyzing row ${i + 1}:`, err);

                    if (i === 0) {
                        clearInterval(progressInterval);
                        setIsAnalysingCareReportLoading(false);
                        alert("Error analyzing first row.");
                    }
                }
            }
            console.log(allResponsedatass);
            setCareDatatoDownload(allResponsedatass);
            setShowCarePlanDownloadButton(true);
        } catch (error) {
            console.error("Unexpected Error:", error);
            alert("Something went wrong while analyzing the report.");
            clearInterval(progressInterval);
            setIsAnalysingCareReportLoading(false);
        }
    };
    console.log(careDataToDownload);

    const handleDownloadCarePlanData = () => {
        if (!careDataToDownload || careDataToDownload.length === 0) return;
      
        // Prepare sections for all clients
        const sections = careDataToDownload.map((clientObj) => {
          const sectionChildren = [
            new Paragraph({
              text: `Client: ${clientObj.client}`,
              heading: HeadingLevel.HEADING_1,
            }),
          ];
      
          // Loop through each property except 'client'
          Object.keys(clientObj).forEach((key) => {
            if (key === "client") return;
      
            const content = clientObj[key];
            const lines = content.split("\n");
      
            lines.forEach((line) => {
              if (!line.trim()) return; // skip empty lines
      
              // Heading
              if (line.startsWith("###")) {
                const headingText = line.replace(/^###\s*/, "");
                sectionChildren.push(
                  new Paragraph({
                    text: headingText,
                    heading: HeadingLevel.HEADING2,
                  })
                );
                return;
              }
      
              // Bullet point
              if (line.trim().startsWith("- ")) {
                const bulletText = line.trim().slice(2).trim();
      
                // Split for bold (**bold**)
                const parts = bulletText.split(/(\*\*.*?\*\*)/g);
                const textRuns = parts.map((part) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return new TextRun({ text: part.slice(2, -2), bold: true });
                  }
                  return new TextRun({ text: part });
                });
      
                sectionChildren.push(
                  new Paragraph({
                    children: textRuns,
                    bullet: { level: 0 },
                  })
                );
                return;
              }
      
              // Regular line
              const parts = line.split(/(\*\*.*?\*\*)/g);
              const textRuns = parts.map((part) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return new TextRun({ text: part.slice(2, -2), bold: true });
                }
                return new TextRun({ text: part });
              });
      
              sectionChildren.push(new Paragraph({ children: textRuns }));
            });
      
            // Add empty paragraph between sections
            sectionChildren.push(new Paragraph({ text: "" }));
          });
      
          return { children: sectionChildren };
        });
      
        // Create document with all sections
        const doc = new Document({
          creator: "CareApp",
          title: "Care Plan Reports",
          description: "Exported care plan data",
          sections: sections,
        });
      
        // Generate and download DOCX
        Packer.toBlob(doc).then((blob) => {
          saveAs(blob, "CarePlanReports.docx");
        });
      };

    useEffect(() => {
        if (analysedCareReportdata.length !== 0) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute

            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [analysedCareReportdata]);

    const resetCareServicesEligibilityState = () => {
        setCarePlanReportFiles([]);
        setIsAnalysingCareReportLoading(false);
        setIsAnalysedCareReportProgress(0);
        setAnalysedCareReportdata([]);
        setIsConsentChecked(false);
        setShowCarePlanDownloadButton(false);
        setCareDatatoDownload([]);
    };

    return (
        <>
            {analysedCareReportdata.length === 0 ? (
                <>
                    <div className="financial-header">
                        <div className="role-selector">
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "Inter",
                                }}
                            >
                                Who are you?
                            </div>
                            <div className="role-toggle-container">
                                <div
                                    onClick={() => setSelectedActor("NDIS")}
                                    style={{
                                        backgroundColor:
                                            selectedActor === "NDIS" ? "#6C4CDC" : "#FFFFFF",
                                        color: selectedActor === "NDIS" ? "white" : "#6C4CDC",
                                        borderTopLeftRadius: "4px",
                                        borderBottomLeftRadius: "4px",
                                        cursor: "pointer",
                                        padding: "6px 12px",
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        fontWeight: "500",
                                    }}
                                    className="role-toggle"
                                >
                                    NDIS
                                </div>
                                <div
                                    onClick={() => setSelectedActor("aged-care")}
                                    style={{
                                        backgroundColor:
                                            selectedActor === "aged-care" ? "#6C4CDC" : "#FFFFFF",
                                        color: selectedActor === "aged-care" ? "white" : "#6C4CDC",
                                        borderTopRightRadius: "4px",
                                        borderBottomRightRadius: "4px",
                                        cursor: "pointer",
                                        padding: "6px 12px",
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        fontWeight: "500",
                                    }}
                                    className="role-toggle"
                                >
                                    Aged Care
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                            <h1 className="titless">CLIENT PROFITABILITY & SERVICE</h1>
                            <Tippy
                                content={
                                    <div style={{ width: '450px', height: 'auto', padding: '4px', fontSize: '15px', fontWeight: '600' }}>
                                        <img src={TooltipPlaceholder} alt="tooltip" style={{ width: '100%' }} />
                                        Each individual row of the Excel/CSV sheet should represent  a single clients information
                                    </div>
                                }
                                trigger="mouseenter focus click"
                                interactive={true}
                                placement="bottom"
                                theme="custom"
                            >
                                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <IoMdInformationCircleOutline size={22} color="#5B36E1" />
                                </div>
                            </Tippy>
                        </div>
                        <div className="sync-toggle">
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "Inter",
                                }}
                            >
                                Sync With Your System
                            </div>
                            <Toggle
                                checked={syncEnabled}
                                onChange={() => setSyncEnabled(!syncEnabled)}
                                className="custom-toggle"
                                icons={false} // ✅ No icons
                            />
                        </div>
                    </div>
                    {/* Info Table */}
                    <div className="info-table">
                        <div className="table-headerss">
                            <span>If You Upload This...</span>
                            <span>Our AI Will Instantly...</span>
                        </div>
                        <div className="table-rowss">
                            <div>Finance System - Client Revenue & Cost Allocation Report</div>
                            <ul>
                                <li>Client Margin Forecasts – Predict low-profit clients ahead of time.</li>
                                <li>
                                    Claim Leakage Alerts – Detect missed or under-billed services.
                                </li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Care Management System - Client Funding Utilisation & Service Delivery Report</div>
                            <ul>
                                <li>Roster Optimisation – Recommend cost-efficient shift allocations.</li>
                                <li>Funding Utilisation – Track and lift package use to 95%+.</li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Rostering System - Roster vs Actual Labour Cost Report</div>
                            <ul>
                                <li>Workforce Productivity – Identify high and low performers by billed hours.</li>
                                <li>
                                    Overtime Risk Warnings – Flag and prevent high-cost shifts.
                                </li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>HR System - Timesheet Accuracy & Workforce Utilisation Report</div>
                            <ul>
                                <li>Service Line Profitability – Show which service types drive margin.</li>
                                <li>Client Mix Optimisation – Recommend the most profitable client ratios.</li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Claims/Billing System - Claim Leakage & Rejection Summary Report</div>
                            <ul>
                                <li>Cost Variance Analysis – Expose clients with abnormal cost patterns.</li>
                                <li>
                                    Cashflow Forecasting – Predict liquidity impact from claims/wages.
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* Date DropDown */}
                    <div className="date-section">
                        {/* Report Start Date */}
                        <div className="date-picker">
                            <label
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "Inter",
                                }}
                            >
                                Report Start Date
                            </label>
                            <div className="date-inputs">
                                <select
                                    value={startDay}
                                    onChange={(e) => setStartDay(e.target.value)}
                                >
                                    <option value="">DD</option>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const day = (i + 1).toString().padStart(2, "0");
                                        return (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        );
                                    })}
                                </select>
                                <select
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(e.target.value)}
                                >
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthValue = (i + 1).toString().padStart(2, "0"); // 01, 02, 03
                                        const monthName = new Date(0, i).toLocaleString("en-US", {
                                            month: "short",
                                        }); // Jan, Feb
                                        return (
                                            <option key={monthValue} value={monthValue}>
                                                {monthName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Report End Date */}
                        <div className="date-picker">
                            <label
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "Inter",
                                }}
                            >
                                Report End Date
                            </label>
                            <div className="date-inputs">
                                <select
                                    value={endDay}
                                    onChange={(e) => setEndDay(e.target.value)}
                                >
                                    <option value="">DD</option>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const day = (i + 1).toString().padStart(2, "0");
                                        return (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        );
                                    })}
                                </select>
                                <select
                                    value={endMonth}
                                    onChange={(e) => setEndMonth(e.target.value)}
                                >
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthValue = (i + 1).toString().padStart(2, "0"); // 01, 02, 03
                                        const monthName = new Date(0, i).toLocaleString("en-US", {
                                            month: "short",
                                        }); // Jan, Feb
                                        return (
                                            <option key={monthValue} value={monthValue}>
                                                {monthName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div
                        className="uploader-grid"
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <div style={{ width: '50%' }}>
                            <UploadFiles
                                files={carePlanreportFiles}
                                setFiles={setCarePlanReportFiles}
                                title={props.selectedRole}
                                subtitle="Upload a single .xlsx, .csv or .xls file"
                                fileformat=".xlsx,.csv,.xls"
                                removeFile={(index) => {
                                    setCarePlanReportFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                multiple={false}
                                isProcessing={isAnalysingCareReportLoading}
                            />
                        </div>
                    </div>

                    <button
                        className="analyse-btn"
                        disabled={isAnalysingCareReportLoading}
                        style={{ backgroundColor: '#000' }}
                        onClick={handleAnalyseReports}
                    >
                        {isAnalysingCareReportLoading
                            ? `Analysing... ${isAnalysedCareReportProgress}%`
                            : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                </>
            ) : (
                <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                        <SummaryReport summaryText={analysedCareReportdata} selectedRole={props.selectedRole} resetCareServicesEligibilityState={resetCareServicesEligibilityState} showCarePlanDownloadButton={showCarePlanDownloadButton} handleDownloadCarePlanData={handleDownloadCarePlanData}/>
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
    );
};

export default CareServicesEligibility;