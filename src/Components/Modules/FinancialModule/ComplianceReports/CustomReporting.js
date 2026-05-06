import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import UploadFiles from "../../../general-components/UploadFiles";
import star from '../../../../Images/star.png';
import SummaryReport from "../../../general-components/SummaryReportViewer";
import '../../../../Styles/general-styles/UploaderPage.css'

const CustomReporting = (props) => {
    const [customReportFiles, setCustomReportFiles] = useState([]);
    const [isCustomProcessing, setIsCustomProcessing] = useState(false);
    const [customProgress, setCustomProgress] = useState(0);
    const [showCustomReport, setShowCustomReport] = useState(false);
    const [customReport, setCustomReport] = useState([]);
    const [payRollReport, setPayRollReport] = useState(null);
    const [isConsentChecked, setIsConsentChecked] = useState(false);

    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };

    const handleAnalyse = async () => {
        if (customReportFiles.length === 0) {
            alert("Please upload the report files.");
            return;
        }
        props.handleClick();
        setIsCustomProcessing(true);
        setCustomProgress(1);

        const interval = setInterval(() => {
            setCustomProgress((prev) => (prev < 92 ? prev + 2 : prev));
        }, 5000);

        console.log('doing custom Reporting.......');
        try {
            const driveForm = new FormData();
            customReportFiles.forEach((file) => {
                driveForm.append("files", file); 
            });

            console.log("Uploading to Google Drive API...",driveForm);
            const driveResponse = await axios.post(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/upload-to-drive",
                driveForm,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            console.log("✅ Drive upload response:", driveResponse.data);
            const payrollForm = new FormData();
            customReportFiles.forEach((file, index) => {
                payrollForm.append(`source${index + 1}`, file, file.name);
            });

            const payrollResponse = await axios.post(
                "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/custom-reporting/tlc/payroll",
                payrollForm,
                { responseType: 'blob' }
            );

            console.log('payrollResponse', payrollResponse);
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
            setCustomReport(summaryText);
            setCustomProgress(100);

            setTimeout(() => {
                setShowCustomReport(true);
                setIsCustomProcessing(false);
            }, 500);
        } catch (error) {
            console.error("Custom Reporting Error:", error);
            alert("Custom Reporting failed. Please check your files or try again.");
            clearInterval(interval);
            setCustomProgress(0);
            setIsCustomProcessing(false);
        }
    };

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


    const isButtonDisabled = customReportFiles.length === 0;

    useEffect(() => {
        if (showCustomReport) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute

            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [showCustomReport]);

    const resetCustomReportingState = () => {
        setCustomReportFiles([]);
        setIsCustomProcessing(false);
        setCustomProgress(0);
        setShowCustomReport(false);
        setCustomReport([]);
        setPayRollReport(null);
        setIsConsentChecked(false);
    };

    return (
        <>
            {(!showCustomReport) ? (
                <>
                    <div className="selectedModule">{props.selectedRole}</div>
                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                    <div>
                        <div className="uploader-grid"
                            style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '50%' }}>
                                <UploadFiles
                                    files={customReportFiles}
                                    setFiles={setCustomReportFiles}
                                    title={props.selectedRole}
                                    subtitle='Upload two .xlsx, .csv or .xls file'
                                    fileformat=".xlsx, .csv, .xls"
                                    removeFile={(index) => {
                                        setCustomReportFiles(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    content="The file must contain metadata in the first row and the header in the second row. Metadata in the first row should specify the payroll date."
                                    multiple={true}
                                    isProcessing={isCustomProcessing}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        className="analyse-btn"
                        disabled={isButtonDisabled || isCustomProcessing}
                        style={{
                            backgroundColor: isButtonDisabled || isCustomProcessing ? '#A1A1AA' : '#000',
                            cursor: isCustomProcessing ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleAnalyse}
                    >
                        {isCustomProcessing ? `${customProgress}% Processing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                    <div style={{ fontSize: '12px', color: 'grey', fontFamily: 'Inter', fontWeight: '400', textAlign: 'center', marginTop: '12px' }}>**Estimated Time to Analyse 4 min**</div>
                </>
            ) : (
                <>
                    <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                            <SummaryReport summaryText={customReport} selectedRole={props.selectedRole} handledownloadPayrollFile={handledownloadPayrollFile} resetCustomReportingState={resetCustomReportingState} />
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
        </>
    );
};

export default CustomReporting;