import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from "axios";
import UploaderZipBox from "../../../general-components/UploaderZipBox";
import star from '../../../../Images/star.png';
import '../../../../Styles/general-styles/UploaderPage.css';
import NewReportIcon from '../../../../Images/NewReportIcon.png';
import incrementAnalysisCount from "../Tlc/TLcAnalysisCount";
import incrementCareVoiceAnalysisCount from "../../SupportAtHomeModule/careVoiceCostAnalysis";

const IncidentManagement = (props) => {
    const [zipFile1, setZipFile1] = useState(null);
    const [zipFile2, setZipFile2] = useState(null);
    const [zipFile3, setZipFile3] = useState(null);
    const [zipFile4, setZipFile4] = useState(null);
    const [isZipProcessing, setIsZipProcessing] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [reportZipData, setReportZipdata] = useState([]);
    const [showFinalZipReport, setShowFinalZipReport] = useState(false);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const userEmail = props?.user?.email
    // const userEmail = "gjavier@tenderlovingcaredisability.com.au"
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
        (userEmail || "").toLowerCase()
    );
    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };

    const handleGenerate = async () => {
        if (!zipFile1) {
            alert("Please upload a zip file");
            return;
        }
        props.handleClick();
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
            await incrementCareVoiceAnalysisCount(userEmail?.trim(), "ai-analysis",0,"incident-management",0);
            setShowFinalZipReport(true);
        } catch (error) {
            console.error("Error processing ZIP:", error);
            alert("Failed to process the ZIP file.");
        } finally {
            setIsZipProcessing(false);
        }
    };

    const handleDownloadCSV = () => {
        if (!Array.isArray(reportZipData) || reportZipData?.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(reportZipData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, 'Incident_Management_Report.csv');
    };

    const isZipButtonDisabled = !zipFile1;

    useEffect(() => {
        if (showFinalZipReport) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute

            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [showFinalZipReport]);

    const resetIncidentManagementState = () => {
        setZipFile1(null);
        setZipFile2(null);
        setZipFile3(null);
        setZipFile4(null);
        setIsZipProcessing(false);
        setZipProgress(0);
        setReportZipdata([]);
        setShowFinalZipReport(false);
        setIsConsentChecked(false);
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
                    Sorry, your account (<strong>{userEmail}</strong>)
                    is not authorized to view this page.
                </p>
            </div>
        )
    }
    return (
        <>
            {(!showFinalZipReport) ? (
                <>
                    <div className="selectedModule">{props.selectedRole}</div>
                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                    <div className="uploader-grid">
                        <UploaderZipBox
                            file={zipFile1}
                            setFile={setZipFile1}
                            title="Incident Logs"
                            subtitle="Upload incident logs"
                            removeFile={() => setZipFile1(null)}
                            disabled={false}
                        />
                        <UploaderZipBox
                            file={zipFile2}
                            setFile={setZipFile2}
                            title="Investigation Reports"
                            subtitle="Upload reports"
                            removeFile={() => setZipFile2(null)}
                            disabled={true}
                        />
                        <UploaderZipBox
                            file={zipFile3}
                            setFile={setZipFile3}
                            title="Root Cause Analysis"
                            subtitle="Upload RCA docs"
                            removeFile={() => setZipFile3(null)}
                            disabled={true}
                        />
                        <UploaderZipBox
                            file={zipFile4}
                            setFile={setZipFile4}
                            title="Corrective Actions"
                            subtitle="Upload action plans"
                            removeFile={() => setZipFile4(null)}
                            disabled={true}
                        />
                    </div>
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


                </>
            ) : (
                <>
                    <div className="reports-box" style={{ height: 'auto' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '24px', marginTop: '14px' }}>
                            <button className="new-report-btn" onClick={resetIncidentManagementState}>
                                <img src={NewReportIcon} alt='newReporticon' style={{ width: '24px' }} /><div>New Report</div>
                            </button>
                        </div>
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
                </>
            )}
        </>
    );
};

export default IncidentManagement;