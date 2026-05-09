import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import UploadFiles from "../../../general-components/UploadFiles";
import star from '../../../../Images/star.png';
import SummaryReport from "../../../general-components/SummaryReportViewer";
import '../../../../Styles/general-styles/UploaderPage.css'
import incrementAnalysisCount from "../Tlc/TLcAnalysisCount";
import incrementCareVoiceAnalysisCount from "../../SupportAtHomeModule/careVoiceCostAnalysis";
import { API_BASE } from "../../../../config/apiBase";
import useModuleOrgLookup from "../../../../hooks/useModuleOrgLookup";
import FinancialHealthNoOrgEmptyState from "../FinancialHealth/FinancialHealthNoOrgEmptyState";
import FinancialHealthAccessManagement from "../FinancialHealth/FinancialHealthAccessManagement";
import { RiSettingsLine } from "react-icons/ri";

const SIRS_API_BASE = `${API_BASE}/api/sirs-analysis`;

const SirsAnalysis = (props) => {
    const userEmail = props?.user?.email;
    const [sirsReportFiles, setSirsReportFiles] = useState([]);
    const [isSirsProcessing, setIsSirsProcessing] = useState(false);
    const [sirsProgress, setSirsProgress] = useState(0);
    const [showSirsReport, setShowSirsReport] = useState(false);
    const [sirsReport, setSirsReport] = useState([]);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [openAccessManagement, setOpenAccessManagement] = useState(false);

    const { currentUserRole, orgLookupStatus, refresh: refetchOrg } =
        useModuleOrgLookup({
            userEmail,
            orgsApiBase: `${SIRS_API_BASE}/organizations`,
        });
    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };

    const handleAnalyse = async () => {
        if (sirsReportFiles.length === 0) {
            alert("Please upload the report files.");
            return;
        }
        props.handleClick();
        setIsSirsProcessing(true);
        setSirsProgress(1);

        const interval = setInterval(() => {
            setSirsProgress((prev) => (prev < 92 ? prev + 2 : prev));
        }, 5000);

        try {
            const file = sirsReportFiles[0];
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
                        setSirsReport([result]);
                        await incrementCareVoiceAnalysisCount(props?.user?.email?.trim(), "ai-analysis",0,"SIRS",0);
                        setSirsProgress(100);
                        setTimeout(() => {
                            setShowSirsReport(true);
                            setIsSirsProcessing(false);
                        }, 500);
                    } else {
                        // Append later results in background
                        setSirsReport(prev => [...prev, result]);
                    }

                } catch (error) {
                    console.error(`Error processing row ${i + 1}`, error);
                }
            }
            clearInterval(interval);
        } catch (error) {
            console.error("Error:", error);
            alert("AI Overloading or network issue.");
            clearInterval(interval);
            setSirsProgress(0);
            setIsSirsProcessing(false);
        }
    };
    const isButtonDisabled = sirsReportFiles.length === 0;

    const resetSirsAnalysisState = () => {
        setSirsReportFiles([]);
        setIsSirsProcessing(false);
        setSirsProgress(0);
        setShowSirsReport(false);
        setSirsReport([]);
        setIsConsentChecked(false);
    };


    useEffect(() => {
        if (showSirsReport) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute

            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [showSirsReport]);

    if (orgLookupStatus === "loading") {
        return (
            <div style={{
                textAlign: "center",
                padding: "120px 20px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937"
            }}>
                <p style={{ fontSize: "15px", color: "#555" }}>Loading…</p>
            </div>
        );
    }
    if (orgLookupStatus === "not_found") {
        return (
            <FinancialHealthNoOrgEmptyState
                userEmail={userEmail}
                moduleLabel="SIRS Analysis"
                registerUrl={`${SIRS_API_BASE}/organizations/register`}
                onRegistered={refetchOrg}
            />
        );
    }
    return (
        <div className="sirs-page">
            {currentUserRole === "admin" && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
                    <button
                        type="button"
                        className="access-mgmt-trigger-btn"
                        onClick={() => setOpenAccessManagement(true)}
                    >
                        <RiSettingsLine size={18} color="#707493" />
                        Access Management
                    </button>
                </div>
            )}
            {(!showSirsReport) ? (
                <>
                    <div className="selectedModule">{props.selectedRole}</div>
                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                    <div>
                        <div className="uploader-grid"
                            style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '50%' }}>
                                <UploadFiles
                                    files={sirsReportFiles}
                                    setFiles={setSirsReportFiles}
                                    title={props.selectedRole}
                                    subtitle='Upload a single .xlsx, .csv or .xls file'
                                    fileformat=".xlsx, .csv, .xls"
                                    removeFile={(index) => {
                                        setSirsReportFiles(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    content="Each individual row of the Excel/CSV sheet should represent a single client's information."
                                    multiple={false}
                                    isProcessing={isSirsProcessing}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        className="analyse-btn"
                        disabled={isButtonDisabled || isSirsProcessing}
                        style={{
                            backgroundColor: isButtonDisabled || isSirsProcessing ? '#A1A1AA' : '#000',
                            cursor: isSirsProcessing ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleAnalyse}
                    >
                        {isSirsProcessing ? `${sirsProgress}% Processing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                    <div style={{ fontSize: '12px', color: 'grey', fontFamily: 'Inter', fontWeight: '400', textAlign: 'center', marginTop: '12px' }}>**Estimated Time to Analyse 4 min**</div>
                </>
            ) : (
                <>
                    <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                            <SummaryReport summaryText={sirsReport} selectedRole={props.selectedRole} resetSirsAnalysisState={resetSirsAnalysisState} />
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
            {openAccessManagement && (
                <FinancialHealthAccessManagement
                    onClose={() => setOpenAccessManagement(false)}
                    userEmail={userEmail}
                    moduleLabel="SIRS Analysis"
                    apiBase={`${SIRS_API_BASE}/access`}
                />
            )}
        </div>
    );
};

export default SirsAnalysis;