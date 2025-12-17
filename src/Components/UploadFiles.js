import React, { useState } from "react";
import '../Styles/UploaderPage.css';
import { RiDeleteBin6Line } from "react-icons/ri";
import fileIcon from '../Images/FileIcon.png';
import { FiUploadCloud } from "react-icons/fi";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import TooltipPlaceholder from '../Images/TooltipPlaceholder.png';
import customPlaceHolder from '../Images/customPlaceholder.jpeg';
import { IoMdInformationCircleOutline } from "react-icons/io";


const UploadFiles = ({ files, setFiles, title, subtitle, removeFile, fileformat, content, multiple, isProcessing }) => {
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        let selectedFiles = Array.from(e.target.files);
        console.log('Deepak', isProcessing)
        console.log(selectedFiles);
        if (!multiple && selectedFiles.length > 0) {
            // Always replace with the latest uploaded file
            selectedFiles = [selectedFiles[selectedFiles.length - 1]];
            setFiles(selectedFiles);
        }
        else if (selectedFiles.length > 0)  {
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', }}>
                {(title !== 'Client Profitability & Service' && title !== 'Participant Events & Incident Management' && title !== 'Incident Auditing') && (
                    <div className="uploader-title" style={{ marginBottom: '0px' }}>{title}</div>
                )}

                {(title === 'SIRS Analysis' || title === 'Custom Reporting' || title === 'Incident Report') && (
                    <Tippy
                        content={
                            <div style={{ width: '450px', height: 'auto', padding: '4px', fontSize: '15px', fontWeight: '600' }}>
                                <img src={title === 'Custom Reporting' ? customPlaceHolder : TooltipPlaceholder} alt="tooltip" style={{ width: '100%' }} />
                                {content}
                            </div>
                        }
                        trigger="mouseenter focus click"
                        interactive={true}
                        placement="right"
                        theme="custom"
                    >
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <IoMdInformationCircleOutline size={22} color="#5B36E1" />
                        </div>
                    </Tippy>
                )}


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

export default UploadFiles;
