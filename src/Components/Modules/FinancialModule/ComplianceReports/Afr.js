import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import UploadFiles from "../../../general-components/UploadFiles";
import star from '../../../../Images/star.png';
import SummaryReport from "../../../general-components/SummaryReportViewer";
import '../../../../Styles/general-styles/UploaderPage.css'

const Afr = (props) => {
    const [afrReportFiles, setafrReportFiles] = useState([]);
    const [isAfrProcessing, setIsAfrProcessing] = useState(false);
    const [afrProgress, setAfrProgress] = useState(0);
    const [showAfrReport, setShowAfrReport] = useState(false);
    const [AfrReport, setAfrReport] = useState([]);
    const [isConsentChecked, setIsConsentChecked] = useState(false);

    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };

    const handleAnalyse = async (props) => {
        alert('This module is not supported yet')
    };

    const isButtonDisabled = afrReportFiles.length === 0;
    return (
        <>
            {(!showAfrReport) ? (
                <>
                    <div className="selectedModule">{props.selectedRole}</div>
                    <div className="selectedModuleDescription">Upload your data and<br></br>get instant insights into spending, funding, and what needs attention</div>
                    <div>
                        <div className="uploader-grid"
                            style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '50%' }}>
                                <UploadFiles
                                    files={afrReportFiles}
                                    setFiles={setafrReportFiles}
                                    title={props.selectedRole}
                                    subtitle='Upload multiple .xlsx, .csv or .xls file'
                                    fileformat=".xlsx, .csv, .xls"
                                    removeFile={(index) => {
                                        setafrReportFiles(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    content="The file must contain metadata in the first row and the header in the second row. Metadata in the first row should specify the payroll date."
                                    multiple={true}
                                    isProcessing={isAfrProcessing}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        className="analyse-btn"
                        disabled={isButtonDisabled || isAfrProcessing}
                        style={{
                            backgroundColor: isButtonDisabled || isAfrProcessing ? '#A1A1AA' : '#000',
                            cursor: isAfrProcessing ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleAnalyse}
                    >
                        {isAfrProcessing ? `${afrProgress}% Processing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                    <div style={{ fontSize: '12px', color: 'grey', fontFamily: 'Inter', fontWeight: '400', textAlign: 'center', marginTop: '12px' }}>**Estimated Time to Analyse 4 min**</div>
                </>
            ) : (
                <>
                    <div className="reports-box" style={{ height: 'auto', marginTop: '30px', padding: '10px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 30px', borderRadius: '10px' }}>
                            <SummaryReport summaryText={AfrReport} selectedRole={props.selectedRole}/>
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

export default Afr;