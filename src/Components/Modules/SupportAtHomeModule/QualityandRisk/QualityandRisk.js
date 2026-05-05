import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { saveAs } from 'file-saver';
import UploadFiles from "../../../general-components/UploadFiles";
import star from '../../../../Images/star.png';
import '../../../../Styles/general-styles/UploaderPage.css';
import SummaryReport from "../../../general-components/SummaryReportViewer";
import '../../../../Styles/general-styles/UploaderPage.css'
import incrementAnalysisCount from "../../FinancialModule/Tlc/TLcAnalysisCount";
import incrementCareVoiceAnalysisCount from "../careVoiceCostAnalysis";

const QualityandRisk = (props) => {
    const [qualityreportFiles, setQualityReportFiles] = useState([]);
    const [isAnalysingQualityReportLoading, setIsAnalysingQualityReportLoading] = useState(false);
    const [isAnalysedQualityReportProgress, setIsAnalysedQualityReportProgress] = useState(0);
    const [analysedQualityReportdata, setAnalysedQualityReportdata] = useState([]);
    const [qualitydatatoDownload, setQualityDatatoDownload] = useState([]);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const RESTRICTED_USERS = [
        "iaquino@tenderlovingcaredisability.com.au",
        "jballares@tenderlovingcaredisability.com.au",
        "kperu@tenderlovingcaredisability.com.au",
        "q.benico@tenderlovingcaredisability.com.au",
        "mboutros@tenderlovingcaredisability.com.au",
        "rjodeh@tenderlovingcaredisability.com.au",
        "ryounes@tenderlovingcaredisability.com.au",
        "stickner@tenderlovingcaredisability.com.au",
        "mtalukder@tenderlovingcaredisability.com.au",
        "kbrennen@tenderlovingcaredisability.com.au",
        "ilaurente@tenderlovingcaredisability.com.au",
        "gjavier@tenderlovingcaredisability.com.au",
        "molley@tenderlovingcaredisability.com.au",
        "SGonzales@tenderlovingcaredisability.com.au",
        "mfarag@tenderlovingcare.com.au"
    ];

    const isRestrictedUser = RESTRICTED_USERS.includes(
        (props?.user?.email || "").toLowerCase()
    );
    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };
    const handleAnalyseReports = async () => {
        if (qualityreportFiles.length === 0) {
            alert("Please upload a file.");
            return;
        }

        props.handleClick();

        let progressInterval;
        try {
            setIsAnalysingQualityReportLoading(true);
            setIsAnalysedQualityReportProgress(1);

            // Start virtual progress
            progressInterval = setInterval(() => {
                setIsAnalysedQualityReportProgress(prev => (prev < 90 ? prev + 4 : prev));
            }, 4000);

            const formData = new FormData();
            qualityreportFiles.forEach(file => {
                formData.append("files", file);
            });

            const response = await axios.post(
                "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/quality-risk/report",
                formData,
            );

            console.log('reponse', response);

            if (response.status === 200 && response.data?.report) {
                const allReports = response.data.report;
                setAnalysedQualityReportdata(allReports);
                await incrementCareVoiceAnalysisCount(props?.user?.email?.trim(), "ai-analysis",0,"quality-and-risk",0);
                //First response triggers UI change
                clearInterval(progressInterval);
                setIsAnalysedQualityReportProgress(100);
                setIsAnalysingQualityReportLoading(false);
            } else {
                throw new Error("No report data found.");
            }
        } catch (error) {
            console.error("Unexpected Error:", error);
            alert("Something went wrong while analyzing the report.");
            clearInterval(progressInterval);
            setIsAnalysingQualityReportLoading(false);
        }
    };

    useEffect(() => {
        if (analysedQualityReportdata.length !== 0) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute

            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [analysedQualityReportdata]);

    const resetQualityandRiskState = () => {
        setQualityReportFiles([]);
        setIsAnalysingQualityReportLoading(false);
        setIsAnalysedQualityReportProgress(0);
        setAnalysedQualityReportdata([]);
        setQualityDatatoDownload([]);
        setIsConsentChecked(false);
        setShowDownloadButton(false);
    };
    if (isRestrictedUser) {
        return (
            <div style={{
                textAlign: "center",
                padding: "120px 20px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937"
            }}>
                {/* <img
                    src={TlcLogo}
                    alt="Access Denied"
                    style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
                /> */}

                <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
                    Access Restricted 🚫
                </h2>

                <p style={{ fontSize: "16px", color: "#555" }}>
                    Sorry, your account (<strong>{props?.user?.email}</strong>)
                    is not authorized to view this page.
                </p>
            </div>
        )
    }
    return (
        <>
            {analysedQualityReportdata.length === 0 ? (
                <>
                    <div className="selectedModule">{props.selectedRole}</div>
                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                    <div
                        className="uploader-grid"
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <div style={{ width: '50%' }}>
                            <UploadFiles
                                files={qualityreportFiles}
                                setFiles={setQualityReportFiles}
                                title={props.selectedRole}
                                subtitle="Upload multiple .xlsx, .csv or .xls files"
                                fileformat=".xlsx,.csv,.xls"
                                removeFile={(index) => {
                                    setQualityReportFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                content='Each individual row of the Excel/CSV sheet should represent  a single clients information'
                                multiple={true}
                                isProcessing={isAnalysingQualityReportLoading}
                            />
                        </div>
                    </div>

                    <button
                        className="analyse-btn"
                        disabled={isAnalysingQualityReportLoading}
                        style={{ backgroundColor: '#000', marginTop: '20px' }}
                        onClick={handleAnalyseReports}
                    >
                        {isAnalysingQualityReportLoading
                            ? `Analysing... ${isAnalysedQualityReportProgress}%`
                            : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                </>
            ) : (
                <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                        <SummaryReport summaryText={analysedQualityReportdata} selectedRole={props.selectedRole} resetQualityandRiskState={resetQualityandRiskState} />
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

export default QualityandRisk;