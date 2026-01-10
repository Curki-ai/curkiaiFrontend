import React, { useState,useEffect} from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { saveAs } from 'file-saver';
import UploadFiles from "../../UploadFiles";
import star from '../../../Images/star.png';
import '../../../Styles/UploaderPage.css';
import SummaryReport from "../../SummaryReportViewer";
import '../../../Styles/UploaderPage.css'

const IncidentReport = (props) => {
    const [incidentreportFiles, setIncidentReportFiles] = useState([]);
    const [isAnalysingIncidentReportLoading, setIsAnalysingIncidentReportLoading] = useState(false);
    const [isAnalysedIncidentReportProgress, setIsAnalysedIncidentReportProgress] = useState(0);
    const [analysedIncidentReportdata, setAnalysedIncidentReportdata] = useState([]);
    const [incidentdatatoDownload, setIncidentDatatoDownload] = useState([]);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [showDownloadButton, setShowDownloadButton] = useState(false);

    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };
    const handleAnalyseReports = async () => {
        if (incidentreportFiles.length === 0) {
            alert("Please upload a file.");
            return;
        }

        props.handleClick();

        let progressInterval;
        try {
            setIsAnalysingIncidentReportLoading(true);
            setIsAnalysedIncidentReportProgress(1);

            // Start virtual progress
            progressInterval = setInterval(() => {
                setIsAnalysedIncidentReportProgress(prev => (prev < 90 ? prev + 4 : prev));
            }, 4000);

            const file = incidentreportFiles[0];
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
                        "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/support-at-home/incident/report",
                        { file_type: "row", row: rowDict }
                    );
                    if (response?.data?.data) {
                        allResponsedata.push(response?.data?.data);
                    }
                    if (response.status === 200) {
                        const result = response.data;
                        setAnalysedIncidentReportdata(prev => [...(prev || []), result]);

                        // ✅ First row: show UI and stop loading/progress
                        if (i === 0) {
                            clearInterval(progressInterval);
                            setIsAnalysedIncidentReportProgress(100);
                            setIsAnalysingIncidentReportLoading(false);
                        }
                    }
                } catch (err) {
                    console.error(`Error analyzing row ${i + 1}:`, err);

                    if (i === 0) {
                        clearInterval(progressInterval);
                        setIsAnalysingIncidentReportLoading(false);
                        alert("Error analyzing first row.");
                    }
                }
            }
            setIncidentDatatoDownload(allResponsedata);
            setShowDownloadButton(true);
        } catch (error) {
            console.error("Unexpected Error:", error);
            alert("Something went wrong while analyzing the report.");
            clearInterval(progressInterval);
            setIsAnalysingIncidentReportLoading(false);
        }
    };

    const handleDownloadIncidentReportCSV = () => {
        if (!Array.isArray(incidentdatatoDownload) || incidentdatatoDownload?.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(incidentdatatoDownload);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, 'Incident_Report.csv');
    };

    useEffect(() => {
        if (analysedIncidentReportdata.length!==0) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute
    
            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [analysedIncidentReportdata]);

    const resetIncidentReportState = () => {
        setIncidentReportFiles([]);
        setIsAnalysingIncidentReportLoading(false);
        setIsAnalysedIncidentReportProgress(0);
        setAnalysedIncidentReportdata([]);
        setIncidentDatatoDownload([]);
        setIsConsentChecked(false);
        setShowDownloadButton(false);
    };

    return (
        <>
            {analysedIncidentReportdata.length === 0 ? (
                <>
                    <div className="selectedModule">{props.selectedRole}</div>
                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                    <div
                        className="uploader-grid"
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <div style={{ width: '50%' }}>
                            <UploadFiles
                                files={incidentreportFiles}
                                setFiles={setIncidentReportFiles}
                                title={props.selectedRole}
                                subtitle="Upload a single .xlsx, .csv or .xls file"
                                fileformat=".xlsx,.csv,.xls"
                                removeFile={(index) => {
                                    setIncidentReportFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                content='Each individual row of the Excel/CSV sheet should represent  a single clients information'
                                multiple={false}
                                isProcessing={isAnalysingIncidentReportLoading}
                            />
                        </div>
                    </div>

                    <button
                        className="analyse-btn"
                        disabled={isAnalysingIncidentReportLoading}
                        style={{ backgroundColor: '#000', marginTop: '20px' }}
                        onClick={handleAnalyseReports}
                    >
                        {isAnalysingIncidentReportLoading
                            ? `Analysing... ${isAnalysedIncidentReportProgress}%`
                            : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                </>
            ) : (
                <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                        <SummaryReport summaryText={analysedIncidentReportdata} selectedRole={props.selectedRole} showDownloadButton={showDownloadButton} handleDownloadIncidentReportCSV={handleDownloadIncidentReportCSV} resetIncidentReportState={resetIncidentReportState}/>
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

export default IncidentReport;